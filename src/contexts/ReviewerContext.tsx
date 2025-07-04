"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface ReviewerInfo {
  name: string;
  role: string;
}

interface ReviewerContextType {
  reviewerInfo: ReviewerInfo;
  updateReviewerInfo: (info: Partial<ReviewerInfo>) => void;
}

const ReviewerContext = createContext<ReviewerContextType | undefined>(
  undefined,
);

export function ReviewerProvider({ children }: { children: ReactNode }) {
  const [reviewerInfo, setReviewerInfo] = useState<ReviewerInfo>({
    name: "",
    role: "",
  });
  const [isClient, setIsClient] = useState(false);

  // Ensure we're on the client side before accessing browser APIs
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load reviewer info from localStorage on mount (only on client)
  useEffect(() => {
    if (!isClient) return;
    
    const storedName = localStorage.getItem("reviewerName");
    const storedRole = localStorage.getItem("reviewerRole");
    if (storedName || storedRole) {
      setReviewerInfo({
        name: storedName || "",
        role: storedRole || "",
      });
    }
  }, [isClient]);

  const updateReviewerInfo = (info: Partial<ReviewerInfo>) => {
    setReviewerInfo((prev) => {
      const newInfo = { ...prev, ...info };

      // Save to localStorage (only on client)
      if (isClient) {
        if (info.name !== undefined) {
          localStorage.setItem("reviewerName", info.name);
        }
        if (info.role !== undefined) {
          localStorage.setItem("reviewerRole", info.role);
        }
      }

      return newInfo;
    });
  };

  return (
    <ReviewerContext.Provider value={{ reviewerInfo, updateReviewerInfo }}>
      {children}
    </ReviewerContext.Provider>
  );
}

export function useReviewer() {
  const context = useContext(ReviewerContext);
  if (context === undefined) {
    throw new Error("useReviewer must be used within a ReviewerProvider");
  }
  return context;
}
