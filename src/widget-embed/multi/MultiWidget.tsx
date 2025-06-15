import React from 'react';
import { WidgetData } from '../index';

interface MultiWidgetProps {
  data: WidgetData;
}

const MultiWidget: React.FC<MultiWidgetProps> = ({ data }) => {
  const { reviews, design } = data;
  // For simplicity, just render all reviews in a vertical list (carousel logic can be added later)
  return (
    <div className="widget-container" style={{ background: design.bgColor }}>
      <div className="widget-content">
        {reviews && reviews.length > 0 ? (
          reviews.map((review, idx) => (
            <div key={review.id || idx} className="review-card">
              <div className="review-content">
                {design.showQuotes ? <span className="quote-mark">"</span> : null}
                <p className="review-text">{review.review_content}</p>
                {design.showQuotes ? <span className="quote-mark">"</span> : null}
              </div>
              <div className="reviewer-info">
                <div className="reviewer-details">
                  <p className="reviewer-name">{review.first_name} {review.last_name}</p>
                  {review.reviewer_role && <p className="reviewer-role">{review.reviewer_role}</p>}
                </div>
                <div className="star-rating">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="star">{i < (review.star_rating ?? 0) ? '★' : '☆'}</span>
                  ))}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="review-card">No reviews yet.</div>
        )}
      </div>
    </div>
  );
};

export default MultiWidget; 