/**
 * Manual Contact Form Component
 * 
 * Form for adding individual contacts manually to the contacts database.
 * Includes all the fields available in the contacts table.
 * Now supports adding up to 15 reviews per contact.
 */

"use client";

import { useState } from "react";
import { Dialog } from "@headlessui/react";
import Icon from "@/components/Icon";
import { createClient } from "@/utils/supabaseClient";
import { platformOptions } from "@/app/components/prompt-features/ReviewPlatformsFeature";

interface ManualContactFormProps {
  isOpen: boolean;
  onClose: () => void;
  onContactCreated: () => void;
}

interface ContactFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  business_name: string;
  role: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  category: string;
  notes: string;
}

interface ReviewData {
  platform: string;
  star_rating?: number;
  review_content: string;
  reviewer_first_name: string;
  reviewer_last_name: string;
  reviewer_role?: string;
  date_posted: string;
  verified: boolean;
}

export default function ManualContactForm({
  isOpen,
  onClose,
  onContactCreated,
}: ManualContactFormProps) {
  const supabase = createClient();
  const [formData, setFormData] = useState<ContactFormData>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    business_name: "",
    role: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "",
    category: "",
    notes: "",
  });

  // Review state management
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReviewIndex, setEditingReviewIndex] = useState<number | null>(null);
  const [reviewFormData, setReviewFormData] = useState<ReviewData>({
    platform: "",
    star_rating: undefined,
    review_content: "",
    reviewer_first_name: "",
    reviewer_last_name: "",
    reviewer_role: "",
    date_posted: new Date().toISOString().split('T')[0],
    verified: true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Review management functions
  const handleReviewInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setReviewFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const addReview = () => {
    if (reviews.length >= 15) return;
    setReviewFormData({
      platform: "",
      star_rating: undefined,
      review_content: "",
      reviewer_first_name: "",
      reviewer_last_name: "",
      reviewer_role: "",
      date_posted: new Date().toISOString().split('T')[0],
      verified: true,
    });
    setEditingReviewIndex(null);
    setShowReviewForm(true);
  };

  const editReview = (index: number) => {
    setReviewFormData(reviews[index]);
    setEditingReviewIndex(index);
    setShowReviewForm(true);
  };

  const deleteReview = (index: number) => {
    setReviews(reviews.filter((_, i) => i !== index));
  };

  const saveReview = () => {
    if (!reviewFormData.review_content.trim() || !reviewFormData.platform) {
      setError("Review content and platform are required");
      return;
    }

    if (editingReviewIndex !== null) {
      // Edit existing review
      const updatedReviews = [...reviews];
      updatedReviews[editingReviewIndex] = reviewFormData;
      setReviews(updatedReviews);
    } else {
      // Add new review
      setReviews([...reviews, reviewFormData]);
    }

    setShowReviewForm(false);
    setEditingReviewIndex(null);
    setError("");
  };

  const cancelReview = () => {
    setShowReviewForm(false);
    setEditingReviewIndex(null);
    setReviewFormData({
      platform: "",
      star_rating: undefined,
      review_content: "",
      reviewer_first_name: "",
      reviewer_last_name: "",
      reviewer_role: "",
      date_posted: new Date().toISOString().split('T')[0],
      verified: true,
    });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      // Get the current session for authentication
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      console.log('ManualContactForm: Session debug:', {
        hasSession: !!session,
        sessionError: sessionError?.message,
        hasAccessToken: !!session?.access_token,
        userId: session?.user?.id
      });
      
      // Prepare headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Add authorization header if we have a session
      if (session && !sessionError) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
        console.log('ManualContactForm: Added Authorization header');
      } else {
        console.log('ManualContactForm: No session available for Authorization header');
      }

      console.log('ManualContactForm: Making API request with headers:', headers);
      
      const response = await fetch("/api/contacts/create", {
        method: "POST",
        headers,
        body: JSON.stringify({
          ...formData,
          reviews: reviews, // Include reviews in the request
        }),
      });

      console.log('ManualContactForm: API response status:', response.status, response.statusText);
      
      const result = await response.json();
      console.log('ManualContactForm: API response data:', result);

      if (!response.ok) {
        if (result.upgrade_required) {
          throw new Error(`${result.error} Please upgrade your plan to add contacts.`);
        }
        throw new Error(result.error || "Failed to create contact");
      }

      setSuccess("Contact created successfully!");
      
      // Reset form
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        business_name: "",
        role: "",
        address_line1: "",
        address_line2: "",
        city: "",
        state: "",
        postal_code: "",
        country: "",
        category: "",
        notes: "",
      });

      // Reset reviews
      setReviews([]);

      // Call parent callback to refresh contacts list
      onContactCreated();

      // Close modal after a brief delay to show success message
      setTimeout(() => {
        onClose();
        setSuccess("");
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to create contact");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] relative">
          {/* Close button positioned outside the scrollable area */}
          <button
            onClick={onClose}
            className="absolute -top-3 -right-3 w-8 h-8 bg-white border border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-50 shadow-md z-10"
          >
            <Icon name="FaTimes" className="w-4 h-4 text-red-500" />
          </button>
          
          <div className="p-6 max-h-[90vh] overflow-y-auto">
          
          <div className="mb-6 flex justify-between items-start">
            <Dialog.Title className="text-2xl font-bold text-slate-blue">
              Add New Contact
            </Dialog.Title>
            
            {/* Top right save button */}
            <button
              type="submit"
              form="contact-form"
              disabled={isSubmitting || !formData.first_name.trim()}
              className="px-6 py-2 bg-slate-blue text-white rounded-lg hover:bg-slate-blue/90 font-semibold shadow flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting && <Icon name="FaSpinner" className="w-4 h-4 animate-spin" />}
              {isSubmitting ? "Creating..." : "Save Contact"}
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
              {success}
            </div>
          )}

          <form id="contact-form" onSubmit={handleSubmit} className="space-y-4">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-transparent"
                  placeholder="Enter first name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-transparent"
                  placeholder="Enter last name"
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-transparent"
                  placeholder="Enter email address"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-transparent"
                  placeholder="Enter phone number"
                />
              </div>
            </div>

            {/* Business Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Name
                </label>
                <input
                  type="text"
                  name="business_name"
                  value={formData.business_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-transparent"
                  placeholder="Enter business name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role/Position
                </label>
                <input
                  type="text"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-transparent"
                  placeholder="Enter role or position"
                />
              </div>
            </div>

            {/* Address Information */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address Line 1
                </label>
                <input
                  type="text"
                  name="address_line1"
                  value={formData.address_line1}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-transparent"
                  placeholder="Enter street address"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address Line 2
                </label>
                <input
                  type="text"
                  name="address_line2"
                  value={formData.address_line2}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-transparent"
                  placeholder="Enter apartment, suite, etc."
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-transparent"
                    placeholder="Enter city"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State/Province
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-transparent"
                    placeholder="Enter state"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    name="postal_code"
                    value={formData.postal_code}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-transparent"
                    placeholder="Enter postal code"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country
                </label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-transparent"
                  placeholder="Enter country"
                />
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-transparent"
                  placeholder="Enter category (e.g., Customer, Partner, Vendor)"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-transparent"
                  placeholder="Enter any additional notes about this contact"
                />
              </div>
            </div>

            {/* Reviews Section */}
            <div className="space-y-4 pt-6 border-t">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Reviews</h3>
                <button
                  type="button"
                  onClick={addReview}
                  disabled={reviews.length >= 15}
                  className="px-3 py-1 bg-slate-blue text-white rounded-md hover:bg-slate-blue/90 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Icon name="FaPlus" className="w-4 h-4" />
                  Add Review {reviews.length > 0 && `(${reviews.length}/15)`}
                </button>
              </div>

              {/* Review Cards */}
              {reviews.length > 0 && (
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {reviews.map((review, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-700">{review.platform}</span>
                          {review.star_rating && (
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Icon
                                  key={i}
                                  name="FaStar"
                                  className={`w-3 h-3 ${i < review.star_rating! ? 'text-yellow-400' : 'text-gray-300'}`}
                                />
                              ))}
                            </div>
                          )}
                          <span className="text-xs text-gray-500">{review.date_posted}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => editReview(index)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteReview(index)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{review.review_content}</p>
                      <div className="text-xs text-gray-500">
                        {review.reviewer_first_name} {review.reviewer_last_name}
                        {review.reviewer_role && ` • ${review.reviewer_role}`}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {reviews.length === 0 && (
                <p className="text-sm text-gray-500 italic">No reviews added yet. Click "Add Review" to get started.</p>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-6 border-t">
              <button
                type="submit"
                disabled={isSubmitting || !formData.first_name.trim()}
                className="px-6 py-2 bg-slate-blue text-white rounded-lg hover:bg-slate-blue/90 font-semibold shadow flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting && <Icon name="FaSpinner" className="w-4 h-4 animate-spin" />}
                {isSubmitting ? "Creating..." : "Save Contact"}
              </button>
            </div>
          </form>

          {/* Review Form Modal */}
          {showReviewForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {editingReviewIndex !== null ? 'Edit Review' : 'Add Review'}
                  </h3>
                  <button
                    onClick={cancelReview}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Icon name="FaTimes" className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); saveReview(); }} className="space-y-4">
                  {/* Platform */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Platform <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="platform"
                      value={reviewFormData.platform}
                      onChange={handleReviewInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-transparent"
                    >
                      <option value="">Select platform</option>
                      {platformOptions.map((platform) => (
                        <option key={platform} value={platform}>
                          {platform}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Star Rating */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Star Rating (Optional)
                    </label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewFormData(prev => ({ ...prev, star_rating: star }))}
                          className={`p-1 rounded ${reviewFormData.star_rating === star ? 'bg-yellow-100' : 'hover:bg-gray-100'}`}
                        >
                          <Icon
                            name="FaStar"
                            className={`w-5 h-5 ${reviewFormData.star_rating && reviewFormData.star_rating >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                          />
                        </button>
                      ))}
                      {reviewFormData.star_rating && (
                        <button
                          type="button"
                          onClick={() => setReviewFormData(prev => ({ ...prev, star_rating: undefined }))}
                          className="text-sm text-gray-500 hover:text-gray-700"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Review Content */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Review Content <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="review_content"
                      value={reviewFormData.review_content}
                      onChange={handleReviewInputChange}
                      required
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-transparent"
                      placeholder="Enter the review content..."
                    />
                  </div>

                  {/* Reviewer Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Reviewer First Name
                      </label>
                      <input
                        type="text"
                        name="reviewer_first_name"
                        value={reviewFormData.reviewer_first_name}
                        onChange={handleReviewInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-transparent"
                        placeholder="Enter first name"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Reviewer Last Name
                      </label>
                      <input
                        type="text"
                        name="reviewer_last_name"
                        value={reviewFormData.reviewer_last_name}
                        onChange={handleReviewInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-transparent"
                        placeholder="Enter last name"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reviewer Role (Optional)
                    </label>
                    <input
                      type="text"
                      name="reviewer_role"
                      value={reviewFormData.reviewer_role}
                      onChange={handleReviewInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-transparent"
                      placeholder="Enter role or position"
                    />
                  </div>

                  {/* Date Posted */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date Posted
                    </label>
                    <input
                      type="date"
                      name="date_posted"
                      value={reviewFormData.date_posted}
                      onChange={handleReviewInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-transparent"
                    />
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="text-red-600 text-sm">{error}</div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <button
                      type="button"
                      onClick={cancelReview}
                      className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-slate-blue text-white rounded-md hover:bg-slate-blue/90 font-medium"
                    >
                      {editingReviewIndex !== null ? 'Update Review' : 'Add Review'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 