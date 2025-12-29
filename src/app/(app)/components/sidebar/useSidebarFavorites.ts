"use client";

import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/utils/apiClient";
import { useAccountData } from "@/auth/hooks/granularAuthHooks";
import { SidebarFavorite } from "./types";

interface UseSidebarFavoritesReturn {
  favorites: SidebarFavorite[];
  favoritePaths: string[];
  isLoading: boolean;
  error: string | null;
  addFavorite: (path: string) => Promise<void>;
  removeFavorite: (path: string) => Promise<void>;
  isFavorited: (path: string) => boolean;
  reorderFavorites: (
    orderedPaths: Array<{ nav_item_path: string; display_order: number }>
  ) => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * Hook to manage sidebar favorites with database persistence
 */
export function useSidebarFavorites(): UseSidebarFavoritesReturn {
  const { selectedAccountId } = useAccountData();
  const [favorites, setFavorites] = useState<SidebarFavorite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch favorites when account changes
  const fetchFavorites = useCallback(async () => {
    if (!selectedAccountId) {
      setFavorites([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await apiClient.get<{ favorites: SidebarFavorite[] }>(
        "/sidebar/favorites"
      );

      setFavorites(response.favorites || []);
    } catch (err) {
      console.error("[useSidebarFavorites] Error fetching favorites:", err);
      setError("Failed to load favorites");
      setFavorites([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedAccountId]);

  // Fetch on mount and when account changes
  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  // Add a favorite with optimistic update
  const addFavorite = useCallback(
    async (path: string) => {
      if (!selectedAccountId) return;

      // Optimistic update
      const tempFavorite: SidebarFavorite = {
        id: `temp-${Date.now()}`,
        account_id: selectedAccountId,
        nav_item_path: path,
        display_order: favorites.length,
        created_at: new Date().toISOString(),
      };

      setFavorites((prev) => [...prev, tempFavorite]);

      try {
        const response = await apiClient.post<{ favorite: SidebarFavorite }>(
          "/sidebar/favorites",
          { nav_item_path: path }
        );

        // Replace temp with real favorite
        setFavorites((prev) =>
          prev.map((f) => (f.id === tempFavorite.id ? response.favorite : f))
        );
      } catch (err) {
        console.error("[useSidebarFavorites] Error adding favorite:", err);
        // Revert optimistic update
        setFavorites((prev) => prev.filter((f) => f.id !== tempFavorite.id));
        throw err;
      }
    },
    [selectedAccountId, favorites.length]
  );

  // Remove a favorite with optimistic update
  const removeFavorite = useCallback(
    async (path: string) => {
      if (!selectedAccountId) return;

      // Store for potential rollback
      const removedFavorite = favorites.find((f) => f.nav_item_path === path);

      // Optimistic update
      setFavorites((prev) => prev.filter((f) => f.nav_item_path !== path));

      try {
        await apiClient.delete("/sidebar/favorites", { nav_item_path: path });
      } catch (err) {
        console.error("[useSidebarFavorites] Error removing favorite:", err);
        // Revert optimistic update
        if (removedFavorite) {
          setFavorites((prev) => [...prev, removedFavorite]);
        }
        throw err;
      }
    },
    [selectedAccountId, favorites]
  );

  // Check if a path is favorited
  const isFavorited = useCallback(
    (path: string) => {
      return favorites.some((f) => f.nav_item_path === path);
    },
    [favorites]
  );

  // Reorder favorites
  const reorderFavorites = useCallback(
    async (
      orderedPaths: Array<{ nav_item_path: string; display_order: number }>
    ) => {
      if (!selectedAccountId) return;

      // Optimistic update
      const previousFavorites = [...favorites];
      const reordered = orderedPaths
        .map((op) => {
          const fav = favorites.find((f) => f.nav_item_path === op.nav_item_path);
          return fav ? { ...fav, display_order: op.display_order } : null;
        })
        .filter(Boolean) as SidebarFavorite[];

      setFavorites(reordered.sort((a, b) => a.display_order - b.display_order));

      try {
        await apiClient.patch("/sidebar/favorites", { favorites: orderedPaths });
      } catch (err) {
        console.error("[useSidebarFavorites] Error reordering favorites:", err);
        // Revert optimistic update
        setFavorites(previousFavorites);
        throw err;
      }
    },
    [selectedAccountId, favorites]
  );

  // Get just the paths for quick lookup
  const favoritePaths = favorites.map((f) => f.nav_item_path);

  return {
    favorites,
    favoritePaths,
    isLoading,
    error,
    addFavorite,
    removeFavorite,
    isFavorited,
    reorderFavorites,
    refetch: fetchFavorites,
  };
}
