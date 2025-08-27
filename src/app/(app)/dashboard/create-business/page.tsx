import { Metadata } from "next";
import CreateBusinessClient from "./CreateBusinessClient";

export const metadata: Metadata = {
  title: "Your Business Basics | PromptReviews",
  description: "Set up your basic business information to get started with PromptReviews.",
};

export default function CreateBusinessPage() {
  return <CreateBusinessClient />;
}
