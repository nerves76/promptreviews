import React, { useState, forwardRef } from "react";
import OfferToggle from "../components/OfferToggle";
import EmojiSentimentSection from "../components/EmojiSentimentSection";
import ReviewWriteSection, {
  ReviewWritePlatform,
} from "../components/ReviewWriteSection";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import {
  FaStar,
  FaHeart,
  FaSmile,
  FaThumbsUp,
  FaBolt,
  FaCoffee,
  FaWrench,
  FaRainbow,
  FaGlassCheers,
  FaDumbbell,
  FaPagelines,
  FaPeace,
} from "react-icons/fa";
import OfferSection from "../components/OfferSection";
import DisableAIGenerationSection from "@/app/components/DisableAIGenerationSection";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { createBrowserClient } from "@supabase/ssr";
import SectionHeader from "@/app/components/SectionHeader";

export interface ProductPromptFormState {
  offerEnabled: boolean;
  offerTitle: string;
  offerBody: string;
  offerUrl: string;
  emojiSentimentEnabled: boolean;
  emojiSentimentQuestion: string;
  emojiFeedbackMessage: string;
  emojiThankYouMessage: string;
  emojiLabels: string[];
  reviewPlatforms: ReviewWritePlatform[];
  fallingEnabled: boolean;
  fallingIcon: string;
  aiButtonEnabled: boolean;
  product_name: string;
  product_description: string;
  features_or_benefits: string[];
  product_photo?: string;
}

interface ProductPromptPageFormProps {
  onSave: (state: ProductPromptFormState) => void;
  isLoading?: boolean;
  initialData?: Partial<ProductPromptFormState>;
  showResetButton?: boolean;
  businessReviewPlatforms?: ReviewWritePlatform[];
  onGenerateReview: (idx: number) => void;
  accountId: string;
}

const ProductPromptPageForm = forwardRef<any, ProductPromptPageFormProps>(
  (
    {
      onSave,
      isLoading,
      initialData,
      showResetButton,
      businessReviewPlatforms = [],
      onGenerateReview,
      accountId,
    },
    ref,
  ) => {
    const [offerEnabled, setOfferEnabled] = useState(
      initialData?.offerEnabled ?? false,
    );
    const [offerTitle, setOfferTitle] = useState(initialData?.offerTitle ?? "");
    const [offerBody, setOfferBody] = useState(initialData?.offerBody ?? "");
    const [offerUrl, setOfferUrl] = useState(initialData?.offerUrl ?? "");
    const [emojiSentimentEnabled, setEmojiSentimentEnabled] = useState(
      initialData?.emojiSentimentEnabled ?? false,
    );
    const [emojiSentimentQuestion, setEmojiSentimentQuestion] = useState(
      initialData?.emojiSentimentQuestion || "How was your experience?",
    );
    const [emojiFeedbackMessage, setEmojiFeedbackMessage] = useState(
      initialData?.emojiFeedbackMessage || "How can we improve?",
    );
    const [emojiThankYouMessage, setEmojiThankYouMessage] = useState(
      initialData?.emojiThankYouMessage &&
        initialData.emojiThankYouMessage.trim() !== ""
        ? initialData.emojiThankYouMessage
        : "Thank you for your feedback. It's important to us.",
    );
    const [emojiLabels, setEmojiLabels] = useState(
      initialData?.emojiLabels ?? [
        "Excellent",
        "Satisfied",
        "Neutral",
        "Unsatisfied",
        "Frustrated",
      ],
    );
    const [reviewPlatforms, setReviewPlatforms] = useState<
      ReviewWritePlatform[]
    >(initialData?.reviewPlatforms ?? []);
    const [fallingEnabled, setFallingEnabled] = useState(
      initialData?.fallingEnabled ?? false,
    );
    const [fallingIcon, setFallingIcon] = useState(
      initialData?.fallingIcon ?? "star",
    );
    const [aiButtonEnabled, setAiButtonEnabled] = useState(
      initialData?.aiButtonEnabled ?? true,
    );
    const [product_name, setProductName] = useState(
      initialData?.product_name ?? "",
    );
    const [product_description, setProductDescription] = useState(
      initialData?.product_description ?? "",
    );
    const [features_or_benefits, setFeaturesOrBenefits] = useState<string[]>(
      initialData?.features_or_benefits ?? [""],
    );
    const [productPhotoUrl, setProductPhotoUrl] = useState(
      initialData?.product_photo || "",
    );
    const [productPhotoFile, setProductPhotoFile] = useState<File | null>(null);
    const [productPhotoError, setProductPhotoError] = useState("");
    const [showCropper, setShowCropper] = useState(false);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(
      null,
    );
    const [rawProductPhotoFile, setRawProductPhotoFile] = useState<File | null>(
      null,
    );
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    const handleEmojiLabelChange = (index: number, val: string) => {
      setEmojiLabels((labels) => labels.map((l, i) => (i === index ? val : l)));
    };

    const getCroppedImg = async (imageSrc: string, cropPixels: Area) => {
      const image = new window.Image();
      image.src = imageSrc;
      await new Promise((resolve) => {
        image.onload = resolve;
      });
      const canvas = document.createElement("canvas");
      canvas.width = cropPixels.width;
      canvas.height = cropPixels.height;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(
        image,
        cropPixels.x,
        cropPixels.y,
        cropPixels.width,
        cropPixels.height,
        0,
        0,
        cropPixels.width,
        cropPixels.height,
      );
      return new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
        }, "image/png");
      });
    };

    const handleProductPhotoChange = (
      e: React.ChangeEvent<HTMLInputElement>,
    ) => {
      setProductPhotoError("");
      const file = e.target.files?.[0];
      if (!file) return;
      if (!["image/png", "image/jpeg", "image/jpg"].includes(file.type)) {
        setProductPhotoError("Only PNG or JPG images are allowed.");
        return;
      }
      if (file.size > 600 * 1024) {
        setProductPhotoError("Product photo must be 600KB or less.");
        return;
      }
      setRawProductPhotoFile(file);
      setShowCropper(true);
      setProductPhotoUrl(URL.createObjectURL(file));
    };

    const onCropComplete = (croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    };

    const handleCropConfirm = async () => {
      if (!productPhotoUrl || !croppedAreaPixels) return;
      const croppedBlob = await getCroppedImg(
        productPhotoUrl,
        croppedAreaPixels,
      );
      const croppedFile = new File(
        [croppedBlob],
        rawProductPhotoFile?.name || "product.png",
        { type: "image/png" },
      );
      setProductPhotoFile(croppedFile);
      setProductPhotoUrl(URL.createObjectURL(croppedFile));
      setShowCropper(false);
    };

    const handleCropCancel = () => {
      setShowCropper(false);
      setProductPhotoFile(null);
      setProductPhotoUrl(initialData?.product_photo || "");
      setRawProductPhotoFile(null);
    };

    const handleProductPhotoUpload = async (
      supabase: any,
      accountId: string,
    ) => {
      if (!productPhotoFile) return productPhotoUrl;
      const fileExt = productPhotoFile.name.split(".").pop();
      const filePath = `product-photos/${accountId}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("products")
        .upload(filePath, productPhotoFile, {
          upsert: true,
          contentType: productPhotoFile.type,
        });
      if (uploadError) {
        setProductPhotoError("Failed to upload product photo.");
        return productPhotoUrl;
      }
      const { data: publicUrlData } = supabase.storage
        .from("products")
        .getPublicUrl(filePath);
      return publicUrlData?.publicUrl || "";
    };

    // Expose a submit function via ref
    React.useImperativeHandle(
      ref,
      () => ({
        submit: async () => {
          let uploadedPhotoUrl = productPhotoUrl;
          if (productPhotoFile) {
            const fileExt = productPhotoFile.name.split(".").pop();
            const filePath = `product-photos/${accountId}-${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage
              .from("products")
              .upload(filePath, productPhotoFile, {
                upsert: true,
                contentType: productPhotoFile.type,
              });
            if (uploadError) {
              setProductPhotoError("Failed to upload product photo.");
              console.error("Upload error:", uploadError);
              return;
            }
            const { data: publicUrlData } = supabase.storage
              .from("products")
              .getPublicUrl(filePath);
            uploadedPhotoUrl = publicUrlData?.publicUrl || "";
          }
          onSave({
            offerEnabled,
            offerTitle,
            offerBody,
            offerUrl,
            emojiSentimentEnabled,
            emojiSentimentQuestion,
            emojiFeedbackMessage,
            emojiThankYouMessage,
            emojiLabels,
            reviewPlatforms,
            fallingEnabled,
            fallingIcon,
            aiButtonEnabled,
            product_name,
            product_description,
            features_or_benefits,
            product_photo: uploadedPhotoUrl,
          });
        },
      }),
      [
        offerEnabled,
        offerTitle,
        offerBody,
        offerUrl,
        emojiSentimentEnabled,
        emojiSentimentQuestion,
        emojiFeedbackMessage,
        emojiThankYouMessage,
        emojiLabels,
        reviewPlatforms,
        fallingEnabled,
        fallingIcon,
        aiButtonEnabled,
        product_name,
        product_description,
        features_or_benefits,
        productPhotoFile,
        productPhotoUrl,
        onSave,
        supabase,
        accountId,
      ],
    );

    return (
      <>
        {showCropper && productPhotoUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 overflow-y-auto">
            <div className="bg-white p-6 rounded shadow-lg relative max-w-2xl w-full">
              <div className="w-full h-96 relative mb-8">
                <Cropper
                  image={productPhotoUrl}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-200 rounded"
                  onClick={handleCropCancel}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="px-4 py-2 bg-slate-blue text-white rounded"
                  onClick={handleCropConfirm}
                >
                  Crop
                </button>
              </div>
            </div>
          </div>
        )}
        <form
          className="space-y-8"
          onSubmit={async (e) => {
            e.preventDefault();
            if (reviewPlatforms.length === 0) {
              if (
                !window.confirm(
                  "You didn't add a review platform. Are you sure you want to save?",
                )
              ) {
                return;
              }
            }
            if (!emojiThankYouMessage || emojiThankYouMessage.trim() === "") {
              alert(
                "Please enter a thank you message for the emoji sentiment module.",
              );
              return;
            }
            onSave({
              offerEnabled,
              offerTitle,
              offerBody,
              offerUrl,
              emojiSentimentEnabled,
              emojiSentimentQuestion,
              emojiFeedbackMessage,
              emojiThankYouMessage:
                emojiThankYouMessage || "Thank you for your feedback!",
              emojiLabels,
              reviewPlatforms,
              fallingEnabled,
              fallingIcon,
              aiButtonEnabled,
              product_name,
              product_description,
              features_or_benefits,
              product_photo: productPhotoUrl,
            });
          }}
        >
          {/* Main Title and Subcopy */}
          <SectionHeader
            icon={null}
            title={
              product_name
                ? `Edit Product Prompt Page`
                : `Create Product Prompt Page`
            }
            subCopy="Let's get a review from a customer who loves your product."
            className="mb-8 mt-2"
          />
          {/* Product Photo Upload - always visible for product pages */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Photo
            </label>
            <input
              type="file"
              accept="image/png, image/jpeg"
              onChange={(e) => {
                console.log("File input changed!");
                handleProductPhotoChange(e);
              }}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
            {productPhotoError && (
              <div className="text-red-500 text-xs mt-1">
                {productPhotoError}
              </div>
            )}
            {productPhotoUrl && !showCropper && (
              <img
                src={productPhotoUrl}
                alt="Product Preview"
                className="mt-2 rounded shadow max-h-32"
              />
            )}
          </div>
          {/* Product Name */}
          {/* Product Image */}
          {/* Product Description */}
          {/* Review Platforms Section with review and AI (same as service) */}
          <div className="mt-16">
            <ReviewWriteSection
              value={reviewPlatforms}
              onChange={setReviewPlatforms}
              onGenerateReview={onGenerateReview}
            />
          </div>
          {/* Special Offer Section (shared design) */}
          <OfferSection
            enabled={offerEnabled}
            onToggle={() => setOfferEnabled((v) => !v)}
            title={offerTitle}
            onTitleChange={setOfferTitle}
            description={offerBody}
            onDescriptionChange={setOfferBody}
            url={offerUrl}
            onUrlChange={setOfferUrl}
          />
          {/* Emoji Sentiment Section (shared design) */}
          <EmojiSentimentSection
            enabled={emojiSentimentEnabled}
            onToggle={() => setEmojiSentimentEnabled((v) => !v)}
            question={emojiSentimentQuestion}
            onQuestionChange={setEmojiSentimentQuestion}
            feedbackMessage={emojiFeedbackMessage}
            onFeedbackMessageChange={setEmojiFeedbackMessage}
            thankYouMessage={emojiThankYouMessage}
            onThankYouMessageChange={setEmojiThankYouMessage}
            emojiLabels={emojiLabels}
            onEmojiLabelChange={handleEmojiLabelChange}
          />
          {/* AI Review Generation Toggle (shared design) */}
          <DisableAIGenerationSection
            enabled={aiButtonEnabled}
            onToggle={() => setAiButtonEnabled((v) => !v)}
          />
          {/* Falling Stars Section (shared design) */}
          <div className="rounded-lg p-4 bg-blue-50 border border-blue-200 flex flex-col gap-2 shadow relative mb-8">
            <div className="flex items-center justify-between mb-2 px-2 py-2">
              <div className="flex items-center gap-3">
                <FaStar className="w-7 h-7 text-slate-blue" />
                <span className="text-2xl font-bold text-[#1A237E]">
                  Falling star animation
                </span>
              </div>
              <button
                type="button"
                onClick={() => setFallingEnabled((v) => !v)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${fallingEnabled ? "bg-slate-blue" : "bg-gray-200"}`}
                aria-pressed={!!fallingEnabled}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${fallingEnabled ? "translate-x-5" : "translate-x-1"}`}
                />
              </button>
            </div>

            {/* Icon picker (enabled) */}
            <div className="flex gap-4 px-2 flex-wrap">
              {[
                {
                  key: "star",
                  label: "Stars",
                  icon: <FaStar className="w-6 h-6 text-yellow-400" />,
                },
                {
                  key: "heart",
                  label: "Hearts",
                  icon: <FaHeart className="w-6 h-6 text-red-500" />,
                },
                {
                  key: "smile",
                  label: "Smiles",
                  icon: <FaSmile className="w-6 h-6 text-yellow-400" />,
                },
                {
                  key: "thumb",
                  label: "Thumbs Up",
                  icon: <FaThumbsUp className="w-6 h-6 text-blue-500" />,
                },
                {
                  key: "bolt",
                  label: "Bolts",
                  icon: <FaBolt className="w-6 h-6 text-amber-400" />,
                },
                {
                  key: "rainbow",
                  label: "Rainbows",
                  icon: <FaRainbow className="w-6 h-6 text-fuchsia-400" />,
                },
                {
                  key: "coffee",
                  label: "Coffee Cups",
                  icon: <FaCoffee className="w-6 h-6 text-amber-800" />,
                },
                {
                  key: "wrench",
                  label: "Wrenches",
                  icon: <FaWrench className="w-6 h-6 text-gray-500" />,
                },
                {
                  key: "confetti",
                  label: "Wine Glass",
                  icon: <FaGlassCheers className="w-6 h-6 text-pink-400" />,
                },
                {
                  key: "barbell",
                  label: "Barbell",
                  icon: <FaDumbbell className="w-6 h-6 text-gray-600" />,
                },
                {
                  key: "flower",
                  label: "Flower",
                  icon: <FaPagelines className="w-6 h-6 text-green-500" />,
                },
                {
                  key: "peace",
                  label: "Peace",
                  icon: <FaPeace className="w-6 h-6 text-purple-500" />,
                },
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  className={`p-2 rounded-full border transition bg-white flex items-center justify-center ${fallingIcon === opt.key ? "border-slate-blue ring-2 ring-slate-blue" : "border-gray-300"}`}
                  onClick={() => setFallingIcon(opt.key)}
                  aria-label={opt.label}
                >
                  {opt.icon}
                </button>
              ))}
            </div>
          </div>
        </form>
        
        {/* Bottom Action Buttons */}
        <div className="border-t border-gray-200 pt-6 mt-8 flex justify-between items-center">
          {/* Reset Button - Bottom Left */}
          {showResetButton && (
            <button
              type="button"
              className="px-4 py-2 text-sm rounded border-2 border-red-500 text-red-600 bg-white hover:bg-red-50 transition-colors"
              onClick={() => {
                if (window.confirm("Are you sure you want to reset to business defaults? Any customizations will be lost.")) {
                  // Reset review platforms to business defaults
                  setReviewPlatforms(businessReviewPlatforms);
                }
              }}
              title="Reset to Business Defaults"
            >
              Reset to Defaults
            </button>
          )}
          
          {/* Save and View Buttons - Bottom Right */}
          <div className="flex gap-3">
            <button
              type="button"
              className="px-4 py-2 text-sm rounded bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 transition-colors"
              onClick={() => {
                // Navigate to the product prompt page preview
                window.open(`/r/${initialData?.product_name || 'preview'}`, '_blank');
              }}
            >
              View
            </button>
            <button
              type="button"
              className="px-4 py-2 text-sm rounded bg-slate-blue text-white hover:bg-slate-blue/90 transition-colors"
              onClick={() => {
                // Trigger form submission
                const form = document.querySelector('form');
                if (form) {
                  form.dispatchEvent(new Event('submit', { bubbles: true }));
                }
              }}
            >
              Save
            </button>
          </div>
        </div>
      </>
    );
  },
);

export default ProductPromptPageForm;
