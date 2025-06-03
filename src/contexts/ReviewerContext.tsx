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

  // Load reviewer info from localStorage on mount
  useEffect(() => {
    const storedName = localStorage.getItem("reviewerName");
    const storedRole = localStorage.getItem("reviewerRole");
    if (storedName || storedRole) {
      setReviewerInfo({
        name: storedName || "",
        role: storedRole || "",
      });
    }
  }, []);

  const updateReviewerInfo = (info: Partial<ReviewerInfo>) => {
    setReviewerInfo((prev) => {
      const newInfo = { ...prev, ...info };

      // Save to localStorage
      if (info.name !== undefined) {
        localStorage.setItem("reviewerName", info.name);
      }
      if (info.role !== undefined) {
        localStorage.setItem("reviewerRole", info.role);
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
