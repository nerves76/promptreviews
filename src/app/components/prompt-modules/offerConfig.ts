// Config for the Special Offer module
import { FaGift } from "react-icons/fa";
import { IconType } from "react-icons";

export interface OfferConfig {
  icon: IconType;
  iconColor: string;
  title: string;
  sectionHeader: string;
  instructions: string;
  suggestion: string;
  description: string;
  buttonText: string;
}

const offerConfig: OfferConfig = {
  icon: FaGift,
  iconColor: "#facc15", // gold/yellow
  title: "Get 10% off your next visit",
  sectionHeader: "Special Offer",
  instructions: "Show this offer or use the link below to claim your deal.",
  suggestion: "Valid for 30 days. One per customer.",
  description: "Valid for 30 days",
  buttonText: "Claim Offer",
};

export default offerConfig;
