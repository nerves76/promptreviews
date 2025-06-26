"use client";

import * as React from "react";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { FiMenu, FiX } from "react-icons/fi";
import { FaUserCircle, FaBell } from "react-icons/fa";
import { Menu } from "@headlessui/react";
import { getUserOrMock } from "@/utils/supabase";
import { isAdmin } from "../../utils/admin";
import { trackEvent, GA_EVENTS } from '../../utils/analytics';

/**
 * CowboyUserIcon component
 * 
 * A user account icon with a white cowboy hat positioned in the center of a slate blue circle.
 * Falls back to the standard user circle icon if the PNG image fails to load.
 */
const CowboyUserIcon = () => {
  const [imageError, setImageError] = useState(false);
  
  if (imageError) {
    return (
      <div className="w-8 h-8 bg-[#1A237E] rounded-full flex items-center justify-center hover:opacity-80 transition-opacity">
        <FaUserCircle className="w-5 h-5 text-white" />
      </div>
    );
  }
  
  return (
    <div className="w-8 h-8 bg-[#1A237E] rounded-full relative hover:opacity-80 transition-opacity">
      <img
        src="https://ltneloufqjktdplodvao.supabase.co/storage/v1/object/public/logos/prompt-assets/cowboy-account-icon.png"
        alt="Account"
        className="absolute inset-0 w-5 h-5 m-auto object-contain"
        onError={() => setImageError(true)}
      />
    </div>
  );
};

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await getUserOrMock(supabase);
      setUser(user);
      
      // Check if user is admin
      if (user) {
        console.log('Header: Checking admin status for user:', user.id, user.email);
        const adminStatus = await isAdmin(user.id);
        console.log('Header: Admin status result:', adminStatus);
        setIsAdminUser(adminStatus);
      } else {
        console.log('Header: No user found');
      }
    };

    getUser();
  }, [supabase]);

  // Add debugging for navigation visibility
  useEffect(() => {
    console.log("Header component rendered, user:", user);
  }, [user]);

  // Fetch recent reviews as notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      const since = new Date(
        Date.now() - 7 * 24 * 60 * 60 * 1000,
      ).toISOString();
      const { data, error } = await supabase
        .from("review_submissions")
        .select(
          "id, first_name, last_name, platform, review_content, created_at",
        )
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(7);
      if (!error && data) {
        setNotifications(
          data.map((r: any) => {
            const name = r.first_name
              ? r.last_name
                ? `${r.first_name} ${r.last_name}`
                : r.first_name
              : "Anonymous";
            return {
              id: r.id,
              message: `New review from ${name} on ${r.platform}`,
              preview: r.review_content?.slice(0, 60) || "",
              created_at: r.created_at,
              read: false,
            };
          }),
        );
      }
    };
    fetchNotifications();
    // eslint-disable-next-line
  }, []);

  const isActive = (path: string) => {
    if (path === "/dashboard" && pathname === "/dashboard") return true;
    if (path !== "/dashboard" && pathname.startsWith(path)) return true;
    return false;
  };

  // Helper to check if a notification is within the last 7 days
  function isRecentNotification(created_at: string | Date) {
    const now = new Date();
    const created = new Date(created_at);
    return now.getTime() - created.getTime() < 7 * 24 * 60 * 60 * 1000;
  }

  // Filter and sort notifications for the bell
  const recentNotifications = notifications
    .filter((n) => isRecentNotification(n.created_at))
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    .slice(0, 7);
  const unreadCount = recentNotifications.filter((n) => !n.read).length;

  // Mark notifications as read when dropdown is opened
  useEffect(() => {
    if (showNotifications && notifications.some((n) => !n.read)) {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
    // Remove notifications older than 7 days
    setNotifications((prev) =>
      prev.filter((n) => isRecentNotification(n.created_at)),
    );
    // eslint-disable-next-line
  }, [showNotifications]);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    if (!showNotifications) return;
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showNotifications]);

  return (
    <header className="bg-white shadow">
      <nav className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center mr-6">
              <Link href="/dashboard" className="flex items-center">
                <span
                  className="h-14 w-auto flex items-center p-1"
                  aria-label="PromptReviews Logo"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="130"
                    height="52"
                    viewBox="0 0 375 150"
                    style={{ display: "block", overflow: "visible" }}
                  >
                    <g>
                      <path
                        d="M 20.121094 13.542969 C 19.683594 13.980469 19.675781 14.28125 19.675781 36.160156 L 19.675781 58.339844 L 20.761719 59.425781 L 32.308594 59.425781 L 32.835938 58.898438 C 33.746094 57.988281 33.890625 55.226562 33.089844 54.007812 L 32.71875 53.441406 L 25.652344 53.441406 L 25.652344 19.082031 L 29.082031 19.082031 C 32.183594 19.082031 32.550781 19.042969 32.941406 18.652344 C 33.847656 17.742188 33.855469 14.613281 32.949219 13.652344 L 32.433594 13.097656 L 26.496094 13.097656 C 20.855469 13.097656 20.539062 13.121094 20.121094 13.542969 M 341.828125 13.53125 C 341.015625 14.347656 340.917969 17.355469 341.671875 18.507812 L 342.046875 19.082031 L 349.117188 19.082031 L 349.117188 53.441406 L 342.03125 53.441406 L 341.582031 54.164062 C 341.210938 54.757812 341.140625 55.179688 341.199219 56.582031 C 341.253906 58.023438 341.347656 58.371094 341.800781 58.855469 L 342.335938 59.425781 L 354.007812 59.425781 L 354.546875 58.882812 L 355.09375 58.339844 L 355.09375 14.1875 L 354.546875 13.644531 L 354.007812 13.097656 L 348.132812 13.097656 C 342.609375 13.097656 342.234375 13.125 341.828125 13.53125 M 156.589844 17.753906 C 148.210938 18.792969 143.222656 24.796875 142.765625 34.378906 C 142.277344 44.585938 146.398438 51.359375 154.375 53.472656 C 156.734375 54.097656 160.925781 54.097656 163.300781 53.472656 C 167.671875 52.324219 171.015625 49.65625 172.886719 45.835938 C 174.140625 43.273438 174.582031 41.195312 174.714844 37.191406 C 174.960938 29.828125 173.660156 25.5 170.132812 21.957031 C 167.445312 19.261719 164.273438 17.929688 159.949219 17.675781 C 158.914062 17.617188 157.402344 17.652344 156.589844 17.753906 M 54.261719 18.199219 C 53.996094 18.304688 53.671875 18.59375 53.542969 18.835938 C 53.378906 19.144531 53.320312 24.453125 53.359375 36.082031 L 53.417969 52.882812 L 54.082031 53.214844 C 54.960938 53.660156 60.734375 53.640625 62.046875 53.191406 L 62.929688 52.886719 L 62.992188 48.207031 L 63.050781 43.53125 L 64.980469 43.398438 C 70.011719 43.054688 73.742188 41.003906 75.835938 37.441406 C 78.175781 33.457031 78.511719 28.035156 76.664062 24.121094 C 74.96875 20.53125 71.726562 18.679688 66.292969 18.199219 C 63.265625 17.929688 54.925781 17.929688 54.261719 18.199219 M 99.40625 18.113281 C 99.144531 18.171875 98.746094 18.425781 98.519531 18.675781 C 98.128906 19.109375 98.105469 19.929688 98.050781 36.066406 L 97.992188 53.007812 L 98.605469 53.265625 C 99.425781 53.613281 106.304688 53.613281 107.121094 53.269531 L 107.726562 53.011719 L 107.785156 47.1875 L 107.84375 41.359375 L 108.535156 41.292969 L 109.222656 41.226562 L 111.625 46.835938 C 113.054688 50.175781 114.246094 52.644531 114.5625 52.941406 C 115.371094 53.691406 116.664062 53.972656 117.890625 53.664062 C 119.9375 53.148438 123.5625 50.746094 124.3125 49.414062 C 124.628906 48.847656 124.554688 48.6875 121.492188 43.570312 L 118.34375 38.3125 L 119.417969 37.28125 C 122.054688 34.75 123.316406 30.796875 122.773438 26.789062 C 122.164062 22.296875 119.511719 19.625 114.585938 18.535156 C 113.320312 18.253906 111.410156 18.148438 106.40625 18.085938 C 102.816406 18.042969 99.667969 18.054688 99.40625 18.113281 M 199.109375 18.121094 C 198.804688 18.164062 198.140625 18.257812 197.625 18.324219 C 197.113281 18.390625 196.496094 18.613281 196.25 18.820312 C 195.820312 19.179688 195.78125 19.796875 195.21875 35.804688 C 194.652344 51.90625 194.644531 52.421875 195.039062 52.710938 C 195.753906 53.234375 197.066406 53.460938 199.390625 53.460938 C 201.980469 53.460938 203.785156 53.140625 204.261719 52.597656 C 204.527344 52.292969 204.640625 50.519531 204.867188 43.023438 C 205.023438 37.964844 205.214844 33.644531 205.289062 33.425781 C 205.378906 33.183594 206.578125 36.796875 208.410156 42.820312 C 210.050781 48.203125 211.507812 52.773438 211.648438 52.96875 C 212.027344 53.496094 217.507812 53.503906 218.03125 52.980469 C 218.222656 52.785156 219.710938 48.195312 221.332031 42.78125 C 224.03125 33.78125 224.292969 33.023438 224.410156 33.933594 C 224.480469 34.484375 224.742188 38.917969 224.988281 43.789062 C 225.328125 50.507812 225.507812 52.71875 225.738281 52.949219 C 226.40625 53.617188 233.101562 53.660156 234.820312 53.007812 C 235.300781 52.824219 235.394531 52.648438 235.398438 51.949219 C 235.402344 50.316406 234.050781 19.851562 233.949219 19.382812 C 233.804688 18.695312 232.839844 18.433594 229.378906 18.148438 C 226.011719 17.871094 222.160156 18.117188 220.78125 18.695312 L 219.996094 19.023438 L 218.046875 25.316406 C 216.976562 28.777344 215.847656 32.402344 215.542969 33.375 L 214.992188 35.140625 L 212.171875 27.167969 C 209.421875 19.378906 209.339844 19.183594 208.601562 18.816406 C 207.421875 18.222656 201.367188 17.777344 199.109375 18.121094 M 257.039062 18.210938 C 256.6875 18.351562 256.351562 18.722656 256.210938 19.128906 C 255.9375 19.917969 255.871094 52.28125 256.140625 52.6875 C 256.230469 52.824219 256.554688 53.070312 256.855469 53.238281 C 257.621094 53.660156 263.683594 53.625 264.933594 53.191406 L 265.816406 52.886719 L 265.878906 48.207031 L 265.9375 43.53125 L 267.789062 43.402344 C 274.109375 42.953125 278.203125 39.890625 280.003906 34.269531 C 280.472656 32.800781 280.570312 32.074219 280.566406 30.054688 C 280.550781 23.570312 277.660156 19.820312 271.679688 18.527344 C 269.640625 18.085938 258 17.835938 257.039062 18.210938 M 299.5625 18.414062 C 298.914062 19.066406 298.785156 19.800781 298.785156 22.851562 C 298.789062 24.972656 298.875 25.816406 299.160156 26.453125 L 299.535156 27.285156 L 305.972656 27.285156 L 305.972656 52.765625 L 306.574219 53.160156 C 307.089844 53.5 307.710938 53.550781 311.0625 53.550781 C 314.414062 53.550781 315.039062 53.5 315.554688 53.160156 L 316.152344 52.765625 L 316.152344 27.285156 L 319.246094 27.285156 C 322.207031 27.285156 322.351562 27.265625 322.664062 26.785156 C 323.433594 25.609375 323.605469 21.8125 322.992188 19.480469 C 322.574219 17.882812 323.3125 17.976562 311.046875 17.976562 C 300.34375 17.976562 299.988281 17.988281 299.5625 18.414062 M 63.042969 30.941406 L 63.042969 34.820312 L 63.878906 34.820312 C 65 34.820312 66.578125 33.996094 67.175781 33.09375 C 67.8125 32.132812 68.015625 30.339844 67.632812 29.0625 C 67.210938 27.640625 66.289062 27.0625 64.449219 27.0625 L 63.042969 27.0625 Z M 107.734375 30.800781 L 107.734375 34.601562 L 108.359375 34.601562 C 108.703125 34.601562 109.480469 34.453125 110.085938 34.273438 C 111.847656 33.746094 112.675781 32.574219 112.675781 30.609375 C 112.671875 28.304688 111.734375 27.375 109.167969 27.132812 L 107.734375 27 Z M 265.929688 30.941406 L 265.929688 34.820312 L 266.648438 34.816406 C 267.550781 34.8125 268.984375 34.15625 269.621094 33.464844 C 270.304688 32.714844 270.574219 31.871094 270.574219 30.464844 C 270.574219 28.042969 269.585938 27.0625 267.152344 27.0625 L 265.929688 27.0625 Z M 156.6875 27.972656 C 156.167969 28.230469 155.480469 28.753906 155.15625 29.136719 C 152.730469 32.011719 152.457031 38.328125 154.613281 41.730469 C 156.492188 44.691406 160.59375 44.804688 162.757812 41.957031 C 163.914062 40.433594 164.265625 38.9375 164.25 35.597656 C 164.230469 32.265625 163.800781 30.757812 162.425781 29.234375 C 160.855469 27.492188 158.636719 27.007812 156.6875 27.972656 M 351 71.601562 C 344.773438 72.609375 340.078125 75.925781 337.625 81.039062 C 336.421875 83.542969 336.175781 84.78125 336.203125 88.132812 C 336.230469 91.621094 336.769531 94.136719 338.070312 96.832031 C 339.734375 100.28125 342.839844 102.882812 348.714844 105.753906 C 352.914062 107.800781 353.605469 108.441406 353.582031 110.226562 C 353.558594 112.054688 351.925781 112.824219 348.960938 112.414062 C 346.390625 112.054688 344.089844 111.042969 340.203125 108.570312 C 338.535156 107.511719 338.46875 107.488281 338.046875 107.867188 C 336.867188 108.9375 335.351562 112.898438 334.980469 115.871094 C 334.527344 119.5 335.449219 121.71875 338.273438 123.800781 C 340.847656 125.699219 343.789062 126.585938 349.066406 127.050781 C 354.097656 127.492188 358.851562 126.765625 362.308594 125.03125 C 367.589844 122.375 370.789062 116.777344 371.167969 109.523438 C 371.433594 104.394531 370.296875 101.203125 367.0625 97.992188 C 364.691406 95.636719 363.316406 94.730469 358.300781 92.207031 C 353.859375 89.972656 353.117188 89.402344 352.964844 88.113281 C 352.835938 87.023438 353.214844 86.289062 354.203125 85.710938 C 355.871094 84.734375 360.511719 85.386719 364.144531 87.109375 C 364.925781 87.480469 365.648438 87.730469 365.753906 87.664062 C 365.859375 87.597656 366.246094 86.945312 366.613281 86.214844 C 368.351562 82.761719 369.695312 78.5 369.695312 76.425781 C 369.695312 75.460938 369.597656 75.238281 368.863281 74.5 C 367.894531 73.53125 365.203125 72.570312 361.730469 71.957031 C 359.375 71.542969 352.722656 71.320312 351 71.601562 M 284.492188 72.074219 C 281.5625 72.25 281.054688 72.492188 280.640625 73.917969 C 280.460938 74.542969 278.667969 81.738281 276.65625 89.90625 C 274.644531 98.074219 272.925781 104.9375 272.835938 105.152344 C 272.746094 105.371094 271.839844 98.359375 270.820312 89.527344 C 269.796875 80.714844 268.921875 73.425781 268.871094 73.335938 C 268.621094 72.890625 267.320312 72.492188 265.386719 72.261719 C 263.15625 72 253.410156 72.101562 252.488281 72.398438 C 252.175781 72.496094 251.988281 72.734375 251.992188 73.03125 C 251.992188 73.289062 253.769531 85 255.945312 99.054688 C 258.964844 118.585938 259.984375 124.707031 260.269531 125.019531 C 261.132812 125.976562 265.207031 126.582031 270.796875 126.585938 C 275.898438 126.589844 279.789062 125.878906 280.695312 124.777344 C 280.847656 124.59375 282.238281 119.742188 283.785156 114 C 285.332031 108.257812 286.632812 103.59375 286.671875 103.632812 C 286.710938 103.671875 287.839844 108.132812 289.175781 113.542969 C 290.511719 118.953125 291.707031 123.75 291.828125 124.207031 C 292.253906 125.785156 294.285156 126.363281 300 126.53125 C 305.730469 126.695312 311.269531 125.96875 312.589844 124.871094 C 313 124.53125 313.617188 121.398438 317.746094 98.714844 C 321.183594 79.808594 322.367188 72.878906 322.1875 72.699219 C 321.121094 71.632812 308.710938 71.636719 306.300781 72.707031 L 305.40625 73.101562 L 303.207031 89.3125 C 301.996094 98.226562 300.945312 105.449219 300.867188 105.359375 C 300.792969 105.273438 299.015625 98.070312 296.917969 89.351562 C 294.816406 80.632812 292.964844 73.285156 292.796875 73.019531 C 292.261719 72.175781 289.003906 71.804688 284.492188 72.074219 M 6.363281 72.410156 C 4.746094 73.105469 4.84375 71.261719 4.90625 99.917969 L 4.964844 125.59375 L 5.816406 126.011719 C 7.460938 126.816406 17.257812 126.738281 19.078125 125.90625 L 19.675781 125.632812 L 19.675781 107.75 L 22.054688 107.75 L 25.652344 116.117188 C 27.632812 120.71875 29.453125 124.773438 29.699219 125.125 C 29.945312 125.476562 30.6875 126.011719 31.351562 126.316406 C 33.019531 127.078125 35.289062 126.957031 37.398438 125.988281 C 40.324219 124.648438 44.464844 121.425781 45.273438 119.863281 C 45.59375 119.238281 45.554688 119.15625 41.007812 111.550781 C 38.484375 107.328125 36.285156 103.664062 36.121094 103.410156 C 35.851562 102.988281 35.894531 102.898438 36.605469 102.390625 C 38.867188 100.777344 41.332031 96.894531 42.28125 93.453125 C 42.941406 91.054688 42.996094 85.359375 42.382812 83.144531 C 40.832031 77.539062 36.886719 74.292969 29.703125 72.707031 C 27.6875 72.261719 26.789062 72.21875 17.355469 72.144531 C 8.457031 72.070312 7.074219 72.105469 6.363281 72.410156 M 60.269531 72.273438 C 59.109375 72.742188 59.175781 71.300781 59.105469 98.53125 C 59.058594 116.492188 59.109375 124.066406 59.28125 124.664062 C 59.445312 125.222656 59.765625 125.652344 60.234375 125.9375 C 60.914062 126.351562 61.453125 126.367188 74.898438 126.371094 C 87.917969 126.371094 88.882812 126.34375 89.199219 125.980469 C 89.828125 125.257812 90.007812 124.679688 90.378906 122.148438 C 90.691406 120.003906 90.707031 119.265625 90.492188 117.289062 C 90.324219 115.765625 90.066406 114.605469 89.746094 113.957031 L 89.261719 112.960938 L 74.324219 112.84375 L 74.324219 105.3125 L 79.027344 105.308594 C 81.613281 105.308594 83.957031 105.246094 84.234375 105.167969 C 84.515625 105.09375 84.882812 104.761719 85.050781 104.433594 C 85.542969 103.484375 85.898438 100.09375 85.765625 97.664062 C 85.632812 95.222656 85.332031 94.109375 84.714844 93.78125 C 84.484375 93.65625 82.152344 93.5625 79.320312 93.5625 L 74.324219 93.5625 L 74.324219 86.027344 L 88.726562 86.027344 L 89.242188 85.511719 C 89.953125 84.800781 90.257812 82.8125 90.25 78.914062 C 90.246094 75.449219 89.902344 73.214844 89.265625 72.511719 C 88.867188 72.070312 88.636719 72.0625 74.789062 72.074219 C 67.050781 72.082031 60.515625 72.171875 60.269531 72.273438 M 106.160156 72.394531 C 103.558594 72.710938 102.785156 72.996094 102.960938 73.570312 C 103.023438 73.777344 106.066406 85.367188 109.726562 99.328125 C 114.972656 119.324219 116.476562 124.789062 116.832031 125.089844 C 118.007812 126.085938 121.640625 126.464844 128.410156 126.300781 C 133.996094 126.160156 136.640625 125.828125 137.875 125.105469 L 138.582031 124.691406 L 145.394531 99.207031 C 149.144531 85.191406 152.183594 73.53125 152.152344 73.296875 C 152.117188 73.042969 151.851562 72.800781 151.496094 72.707031 C 150.210938 72.367188 146.289062 72.0625 143.175781 72.0625 C 138.941406 72.0625 136.480469 72.371094 135.007812 73.082031 C 134.035156 73.554688 133.816406 73.769531 133.640625 74.457031 C 133.523438 74.910156 132.113281 82.457031 130.507812 91.234375 C 128.90625 100.015625 127.527344 107.269531 127.449219 107.355469 C 127.367188 107.445312 125.832031 99.96875 124.035156 90.742188 C 122.238281 81.515625 120.648438 73.820312 120.5 73.644531 C 120.042969 73.085938 118.535156 72.546875 116.734375 72.300781 C 114.46875 71.988281 109.117188 72.035156 106.160156 72.394531 M 164.671875 72.386719 C 163.957031 72.890625 163.476562 74.371094 163.28125 76.703125 C 162.933594 80.796875 163.613281 84.714844 164.78125 85.34375 C 165.035156 85.480469 166.433594 85.582031 168.011719 85.582031 L 170.789062 85.582031 L 170.789062 112.847656 L 168.261719 112.847656 C 166.871094 112.847656 165.46875 112.949219 165.152344 113.070312 C 164.328125 113.382812 163.792969 114.765625 163.460938 117.449219 C 163.117188 120.246094 163.449219 123.683594 164.21875 125.261719 L 164.707031 126.257812 L 191.996094 126.375 L 192.441406 125.808594 C 194.101562 123.691406 193.964844 115.195312 192.242188 113.46875 C 191.628906 112.855469 191.589844 112.847656 188.839844 112.847656 L 186.058594 112.847656 L 186.058594 85.582031 L 188.695312 85.582031 C 190.144531 85.582031 191.492188 85.519531 191.6875 85.445312 C 192.242188 85.234375 192.714844 84.125 193.042969 82.277344 C 193.761719 78.253906 193.015625 72.710938 191.6875 72.199219 C 191.492188 72.125 185.4375 72.0625 178.234375 72.0625 C 167.054688 72.0625 165.070312 72.109375 164.671875 72.386719 M 208.472656 72.285156 C 208.207031 72.390625 207.882812 72.679688 207.753906 72.921875 C 207.429688 73.527344 207.421875 124.667969 207.746094 125.273438 C 208.332031 126.375 208.277344 126.371094 223.207031 126.371094 C 237.050781 126.371094 237.152344 126.367188 237.578125 125.910156 C 238.824219 124.566406 239.265625 118.386719 238.363281 114.910156 C 237.789062 112.707031 238.355469 112.847656 230.050781 112.847656 L 222.785156 112.847656 L 222.785156 105.3125 L 227.652344 105.3125 C 232.179688 105.3125 232.550781 105.28125 232.949219 104.878906 C 233.699219 104.132812 233.933594 102.734375 233.945312 98.996094 C 233.957031 95.273438 233.753906 94.210938 232.945312 93.777344 C 232.726562 93.660156 230.367188 93.5625 227.667969 93.5625 L 222.785156 93.5625 L 222.785156 86.027344 L 229.769531 86.027344 C 234.347656 86.027344 236.90625 85.945312 237.199219 85.789062 C 238.117188 85.292969 238.351562 84.183594 238.449219 79.800781 C 238.546875 75.347656 238.335938 73.589844 237.578125 72.628906 L 237.132812 72.0625 L 223.046875 72.074219 C 215.296875 72.082031 208.738281 72.179688 208.472656 72.285156 M 19.675781 91.710938 L 19.675781 97.398438 L 21.46875 97.257812 C 24.957031 96.988281 26.722656 95.542969 27.226562 92.539062 C 27.578125 90.453125 27.238281 88.847656 26.179688 87.613281 C 25.214844 86.480469 23.84375 86.027344 21.40625 86.027344 L 19.675781 86.027344 Z M 19.675781 91.710938 "
                        fill="#2E4A7D"
                        fillRule="evenodd"
                      />
                    </g>
                  </svg>
                </span>
              </Link>
            </div>
            {/* Desktop Nav */}
            <div className="flex ml-10 space-x-8">
              <Link
                href="/dashboard"
                className={`${
                  isActive("/dashboard")
                    ? "border-[#1A237E] text-[#1A237E]"
                    : "border-transparent text-[#1A237E] hover:border-[#1A237E]/30 hover:text-[#1A237E]"
                } inline-flex items-center px-1 pt-1 border-b-4 text-base font-medium transition-colors duration-200 h-16`}
              >
                Dashboard
              </Link>
              <Link
                href="/prompt-pages"
                className={`${
                  isActive("/prompt-pages")
                    ? "border-[#1A237E] text-[#1A237E]"
                    : "border-transparent text-[#1A237E] hover:border-[#1A237E]/30 hover:text-[#1A237E]"
                } inline-flex items-center px-1 pt-1 border-b-4 text-base font-medium transition-colors duration-200 h-16`}
              >
                Prompt pages
              </Link>
              <Link
                href="/dashboard/business-profile"
                className={`${
                  isActive("/dashboard/business-profile")
                    ? "border-[#1A237E] text-[#1A237E]"
                    : "border-transparent text-[#1A237E] hover:border-[#1A237E]/30 hover:text-[#1A237E]"
                } inline-flex items-center px-1 pt-1 border-b-4 text-base font-medium transition-colors duration-200 h-16`}
              >
                Your business
              </Link>
              <Link
                href="/dashboard/reviews"
                className={`${
                  isActive("/dashboard/reviews")
                    ? "border-[#1A237E] text-[#1A237E]"
                    : "border-transparent text-[#1A237E] hover:border-[#1A237E]/30 hover:text-[#1A237E]"
                } inline-flex items-center px-1 pt-1 border-b-4 text-base font-medium transition-colors duration-200 h-16`}
              >
                Your reviews
              </Link>
              <Link
                href="/dashboard/widget"
                className={`${
                  isActive("/dashboard/widget")
                    ? "border-[#1A237E] text-[#1A237E]"
                    : "border-transparent text-[#1A237E] hover:border-[#1A237E]/30 hover:text-[#1A237E]"
                } inline-flex items-center px-1 pt-1 border-b-4 text-base font-medium transition-colors duration-200 h-16`}
              >
                Widgets
              </Link>
            </div>
            {/* Notification Bell (moved here) */}
            <div className="hidden md:flex items-center ml-10 mr-4">
              <div className="relative top-1">
                <button
                  className="relative focus:outline-none"
                  onClick={() => setShowNotifications((v) => !v)}
                  aria-label="Show notifications"
                >
                  <FaBell className="w-6 h-6 text-[#1A237E] hover:text-[#1A237E]/80 transition-colors" />
                  {notifications.filter((n) => !n.read).length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-pink-300 text-[#1A237E] text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold border border-white">
                      {notifications.filter((n) => !n.read).length}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <div
                    ref={menuRef}
                    className="absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50"
                  >
                    <div className="py-2 max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-6 text-center text-gray-400">
                          No notifications
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <a
                            key={n.id}
                            href={`/dashboard/reviews#${n.id}`}
                            className="px-4 py-3 border-b last:border-b-0 flex flex-col gap-1 hover:bg-gray-50 transition-colors cursor-pointer no-underline"
                            onClick={() => setShowNotifications(false)}
                          >
                            <span className="text-sm text-gray-800">
                              {n.message}
                            </span>
                            {n.preview && (
                              <span className="text-xs text-gray-500 italic">
                                {n.preview}
                                {n.preview.length === 60 ? "…" : ""}
                              </span>
                            )}
                            <span className="text-xs text-gray-400">
                              {new Date(n.created_at).toLocaleString()}
                            </span>
                          </a>
                        ))
                      )}
                    </div>
                    <div className="border-t border-gray-100 px-4 py-2 text-center">
                      <Link
                        href="/dashboard/reviews"
                        className="text-xs text-indigo-700 font-semibold hover:underline"
                      >
                        View all
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Desktop Account/Sign In */}
          <div className="hidden md:ml-6 md:flex md:items-center gap-4">
            {user ? (
              <Menu as="div" className="relative inline-block text-left">
                <Menu.Button className="flex items-center focus:outline-none">
                  <CowboyUserIcon />
                </Menu.Button>
                <Menu.Items className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                  <div className="py-1">
                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          href="/account"
                          className={`${active ? "bg-[#1A237E]/10 text-[#1A237E]" : "text-gray-700"} block px-4 py-2 text-sm`}
                        >
                          Account details
                        </Link>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          href="/dashboard/analytics"
                          className={`${active ? "bg-[#1A237E]/10 text-[#1A237E]" : "text-gray-700"} block px-4 py-2 text-sm`}
                        >
                          Analytics
                        </Link>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          href="/dashboard/plan"
                          className={`${active ? "bg-[#1A237E]/10 text-[#1A237E]" : "text-gray-700"} block px-4 py-2 text-sm`}
                        >
                          Plan
                        </Link>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          href="/dashboard/contacts"
                          className={`${active ? "bg-[#1A237E]/10 text-[#1A237E]" : "text-gray-700"} block px-4 py-2 text-sm`}
                        >
                          Contacts
                        </Link>
                      )}
                    </Menu.Item>
                    {isAdminUser && (
                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            href="/admin"
                            className={`${active ? "bg-purple-50 text-purple-700" : "text-purple-600"} block px-4 py-2 text-sm font-medium`}
                          >
                            Admin Panel
                          </Link>
                        )}
                      </Menu.Item>
                    )}
                    <div className="border-t border-gray-100 my-1" />
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={async () => {
                            // Track sign out event
                            trackEvent(GA_EVENTS.SIGN_OUT, {
                              timestamp: new Date().toISOString(),
                            });
                            await supabase.auth.signOut();
                            router.push("/auth/sign-in");
                          }}
                          className={`${active ? "bg-red-50 text-red-700" : "text-red-600"} block w-full text-left px-4 py-2 text-sm`}
                        >
                          Sign out
                        </button>
                      )}
                    </Menu.Item>
                  </div>
                </Menu.Items>
              </Menu>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md bg-indigo-100 text-indigo-800 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-300 transition-colors duration-200"
              >
                Sign in
              </Link>
            )}
          </div>
          {/* Hamburger Icon for Mobile */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
              aria-label="Open main menu"
            >
              {menuOpen ? (
                <FiX className="h-6 w-6" />
              ) : (
                <FiMenu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
        {/* Mobile Menu Dropdown */}
        {menuOpen && (
          <div className="md:hidden absolute left-0 right-0 bg-white shadow-lg z-50 mt-2 rounded-b-xl">
            <div className="px-2 pt-2 pb-3 space-y-1 flex flex-col">
              <Link
                href="/dashboard"
                className={`${
                  isActive("/dashboard")
                    ? "bg-[#1A237E]/10 text-[#1A237E]"
                    : "text-[#1A237E] hover:bg-[#1A237E]/10"
                } block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200`}
                onClick={() => setMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                href="/prompt-pages"
                className={`${
                  isActive("/prompt-pages")
                    ? "bg-[#1A237E]/10 text-[#1A237E]"
                    : "text-[#1A237E] hover:bg-[#1A237E]/10"
                } block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200`}
                onClick={() => setMenuOpen(false)}
              >
                Prompt pages
              </Link>
              <Link
                href="/dashboard/business-profile"
                className={`${
                  isActive("/dashboard/business-profile")
                    ? "bg-[#1A237E]/10 text-[#1A237E]"
                    : "text-[#1A237E] hover:bg-[#1A237E]/10"
                } block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200`}
                onClick={() => setMenuOpen(false)}
              >
                Your business
              </Link>
              <Link
                href="/dashboard/reviews"
                className={`${
                  isActive("/dashboard/reviews")
                    ? "bg-[#1A237E]/10 text-[#1A237E]"
                    : "text-[#1A237E] hover:bg-[#1A237E]/10"
                } block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200`}
                onClick={() => setMenuOpen(false)}
              >
                Your reviews
              </Link>
              <Link
                href="/dashboard/widget"
                className={`${
                  isActive("/dashboard/widget")
                    ? "bg-[#1A237E]/10 text-[#1A237E]"
                    : "text-[#1A237E] hover:bg-[#1A237E]/10"
                } block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200`}
                onClick={() => setMenuOpen(false)}
              >
                Widgets
              </Link>
              {user ? (
                <>
                  <Link
                    href="/account"
                    className={`${
                      isActive("/account")
                        ? "bg-[#1A237E]/10 text-[#1A237E]"
                        : "text-[#1A237E] hover:bg-[#1A237E]/10"
                    } block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200`}
                    onClick={() => setMenuOpen(false)}
                  >
                    Account
                  </Link>
                  <Link
                    href="/dashboard/analytics"
                    className={`${
                      isActive("/dashboard/analytics")
                        ? "bg-[#1A237E]/10 text-[#1A237E]"
                        : "text-[#1A237E] hover:bg-[#1A237E]/10"
                    } block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200`}
                    onClick={() => setMenuOpen(false)}
                  >
                    Analytics
                  </Link>
                  <Link
                    href="/dashboard/plan"
                    className={`${
                      isActive("/dashboard/plan")
                        ? "bg-[#1A237E]/10 text-[#1A237E]"
                        : "text-[#1A237E] hover:bg-[#1A237E]/10"
                    } block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200`}
                    onClick={() => setMenuOpen(false)}
                  >
                    Plan
                  </Link>
                  <Link
                    href="/dashboard/contacts"
                    className={`${
                      isActive("/dashboard/contacts")
                        ? "bg-[#1A237E]/10 text-[#1A237E]"
                        : "text-[#1A237E] hover:bg-[#1A237E]/10"
                    } block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200`}
                    onClick={() => setMenuOpen(false)}
                  >
                    Contacts
                  </Link>
                  {isAdminUser && (
                    <Link
                      href="/admin"
                      className="text-purple-600 hover:bg-purple-50 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
                      onClick={() => setMenuOpen(false)}
                    >
                      Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={async () => {
                      // Track sign out event
                      trackEvent(GA_EVENTS.SIGN_OUT, {
                        timestamp: new Date().toISOString(),
                      });
                      await supabase.auth.signOut();
                      router.push("/auth/sign-in");
                      setMenuOpen(false);
                    }}
                    className="text-red-600 hover:bg-red-50 block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <Link
                  href="/auth/sign-in"
                  className="text-[#1A237E] hover:bg-[#1A237E]/10 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
                  onClick={() => setMenuOpen(false)}
                >
                  Sign in
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
