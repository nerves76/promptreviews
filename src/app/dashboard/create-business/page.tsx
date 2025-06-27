import { Metadata } from "next";
import CreateBusinessClient from "./CreateBusinessClient";

export const metadata: Metadata = {
  title: "Create Business Profile | PromptReviews",
  description: "Set up your business profile to get started with PromptReviews.",
};

export default function CreateBusinessPage() {
  return <CreateBusinessClient />;
}
