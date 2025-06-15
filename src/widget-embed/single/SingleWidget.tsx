import React from 'react';
import './SingleWidget.css';

interface Review {
  id: string;
  review_content: string;
  first_name: string;
  last_name: string;
  reviewer_role: string;
  star_rating?: number;
  created_at: string;
}

interface DesignState {
  bgType: "none" | "solid";
  bgColor: string;
  textColor: string;
  accentColor: string;
  bodyTextColor: string;
  nameTextColor: string;
  roleTextColor: string;
  quoteFontSize: number;
  attributionFontSize: number;
  borderRadius: number;
  shadow: boolean;
  bgOpacity: number;
  border: boolean;
  borderWidth: number;
  lineSpacing: number;
  showQuotes: boolean;
  showRelativeDate: boolean;
  width: number;
  sectionBgType: "none" | "custom";
  sectionBgColor: string;
  shadowIntensity: number;
  shadowColor: string;
  borderColor: string;
  font: string;
}

interface SingleWidgetProps {
  data: {
    reviews: Review[];
    design: DesignState;
    universalPromptSlug?: string | null;
  };
}

const SingleWidget: React.FC<SingleWidgetProps> = ({ data }) => {
  const { reviews, design } = data;
  const review = reviews[0]; // SingleWidget only shows the first review

  if (!review) {
    return null;
  }

  const initials = `${review.first_name?.[0] || ''}${review.last_name?.[0] || ''}`;
  const fullName = `${review.first_name || ''} ${review.last_name || ''}`.trim();

  // Apply design variables
  const style = {
    '--bg-color': design.bgColor,
    '--text-color': design.textColor,
    '--accent-color': design.accentColor,
    '--body-text-color': design.bodyTextColor,
    '--name-text-color': design.nameTextColor,
    '--role-text-color': design.roleTextColor,
    '--quote-font-size': `${design.quoteFontSize}px`,
    '--attribution-font-size': `${design.attributionFontSize}px`,
    '--border-radius': `${design.borderRadius}px`,
    '--border-width': `${design.borderWidth}px`,
    '--border-color': design.borderColor,
    '--line-spacing': design.lineSpacing,
    '--shadow': design.shadow ? `0 4px 6px ${design.shadowColor}` : 'none',
    '--font-family': design.font,
  } as React.CSSProperties;

  return (
    <div className="widget-container" style={style}>
      <div className="widget-content">
        <div className="review-card">
          <div className="review-content">
            {review.review_content}
          </div>
          <div className="reviewer-info">
            <div className="reviewer-avatar">
              {initials}
            </div>
            <div className="reviewer-details">
              <div className="reviewer-name">{fullName}</div>
              <div className="reviewer-role">{review.reviewer_role}</div>
              {review.star_rating && (
                <div className="star-rating">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="star">
                      {i < review.star_rating ? '★' : '☆'}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingleWidget; 