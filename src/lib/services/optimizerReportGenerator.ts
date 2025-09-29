import jsPDF from 'jspdf';

export interface BusinessData {
  businessName: string;
  industry: string;
  companySize: string;
  googleMapsUrl: string;
  email: string;
}

export interface AnalysisData {
  totalReviews: number;
  averageRating: number;
  reviewTrend: number;
  monthlyViews: number;
  viewsTrend: number;
  unrespondedReviews: number;
  unansweredQuestions: number;
  seoScore: number;
  photoCount: number;
}

export interface OptimizationOpportunity {
  title: string;
  description: string;
  impact: string;
  priority: 'high' | 'medium' | 'low';
  estimatedTime: string;
  category: string;
}

const PROMPTREVIEWS_BLUE = '#4F46E5';
const PROMPTREVIEWS_DARK_BLUE = '#3730A3';
const LIGHT_GRAY = '#F8FAFC';
const DARK_GRAY = '#1F2937';
const GREEN = '#10B981';
const ORANGE = '#F59E0B';
const RED = '#EF4444';

export class OptimizerReportGenerator {
  private pdf: jsPDF;
  private pageHeight: number;
  private pageWidth: number;
  private currentY: number = 0;
  private margin: number = 20;
  private lineHeight: number = 8;

  constructor() {
    this.pdf = new jsPDF('p', 'mm', 'a4');
    this.pageHeight = this.pdf.internal.pageSize.height;
    this.pageWidth = this.pdf.internal.pageSize.width;
  }

  private checkPageBreak(spaceNeeded: number = 30): void {
    if (this.currentY + spaceNeeded > this.pageHeight - this.margin) {
      this.pdf.addPage();
      this.currentY = this.margin;
      this.addPageHeader();
    }
  }

  private addPageHeader(): void {
    // Add PromptReviews branding header on every page except first
    if (this.pdf.getCurrentPageInfo().pageNumber > 1) {
      this.pdf.setFillColor(248, 250, 252); // Light gray background
      this.pdf.rect(0, 0, this.pageWidth, 15, 'F');

      this.pdf.setTextColor(PROMPTREVIEWS_DARK_BLUE);
      this.pdf.setFontSize(10);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text('PromptReviews - Google Business Optimizer Report', this.margin, 8);

      // Add page number
      const pageNum = this.pdf.getCurrentPageInfo().pageNumber;
      this.pdf.text(`Page ${pageNum}`, this.pageWidth - this.margin - 15, 8);

      this.currentY = 20;
    }
  }

  private addTitle(title: string, fontSize: number = 16, color: string = DARK_GRAY): void {
    this.checkPageBreak(15);
    this.pdf.setTextColor(color);
    this.pdf.setFontSize(fontSize);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text(title, this.margin, this.currentY);
    this.currentY += this.lineHeight + 5;
  }

  private addSubtitle(subtitle: string, fontSize: number = 12, color: string = DARK_GRAY): void {
    this.checkPageBreak(10);
    this.pdf.setTextColor(color);
    this.pdf.setFontSize(fontSize);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.text(subtitle, this.margin, this.currentY);
    this.currentY += this.lineHeight + 3;
  }

  private addParagraph(text: string, fontSize: number = 10, color: string = DARK_GRAY): void {
    this.checkPageBreak(20);
    this.pdf.setTextColor(color);
    this.pdf.setFontSize(fontSize);
    this.pdf.setFont('helvetica', 'normal');

    const lines = this.pdf.splitTextToSize(text, this.pageWidth - 2 * this.margin);
    for (const line of lines) {
      this.checkPageBreak(8);
      this.pdf.text(line, this.margin, this.currentY);
      this.currentY += this.lineHeight;
    }
    this.currentY += 3;
  }

  private addBulletPoint(text: string, fontSize: number = 10): void {
    this.checkPageBreak(15);
    this.pdf.setTextColor(DARK_GRAY);
    this.pdf.setFontSize(fontSize);
    this.pdf.setFont('helvetica', 'normal');

    // Add bullet
    this.pdf.setTextColor(PROMPTREVIEWS_BLUE);
    this.pdf.text('•', this.margin + 5, this.currentY);

    // Add text
    this.pdf.setTextColor(DARK_GRAY);
    const lines = this.pdf.splitTextToSize(text, this.pageWidth - 2 * this.margin - 10);
    for (let i = 0; i < lines.length; i++) {
      this.checkPageBreak(8);
      this.pdf.text(lines[i], this.margin + 12, this.currentY);
      if (i < lines.length - 1) {
        this.currentY += this.lineHeight;
      }
    }
    this.currentY += this.lineHeight + 2;
  }

  private addMetricBox(label: string, value: string, color: string = PROMPTREVIEWS_BLUE): void {
    const boxWidth = 45;
    const boxHeight = 25;

    this.checkPageBreak(boxHeight + 5);

    // Draw box
    this.pdf.setFillColor(color);
    this.pdf.rect(this.margin, this.currentY, boxWidth, boxHeight, 'F');

    // Add value
    this.pdf.setTextColor(255, 255, 255);
    this.pdf.setFontSize(18);
    this.pdf.setFont('helvetica', 'bold');
    const valueWidth = this.pdf.getTextWidth(value);
    this.pdf.text(value, this.margin + (boxWidth - valueWidth) / 2, this.currentY + 12);

    // Add label
    this.pdf.setFontSize(8);
    this.pdf.setFont('helvetica', 'normal');
    const labelLines = this.pdf.splitTextToSize(label, boxWidth - 4);
    const labelY = this.currentY + 18;
    for (let i = 0; i < labelLines.length; i++) {
      const labelWidth = this.pdf.getTextWidth(labelLines[i]);
      this.pdf.text(labelLines[i], this.margin + (boxWidth - labelWidth) / 2, labelY + (i * 6));
    }
  }

  private addSection(title: string): void {
    this.checkPageBreak(25);

    // Section header background
    this.pdf.setFillColor(79, 70, 229); // PROMPTREVIEWS_BLUE
    this.pdf.rect(this.margin - 5, this.currentY - 3, this.pageWidth - 2 * this.margin + 10, 12, 'F');

    // Section title
    this.pdf.setTextColor(255, 255, 255);
    this.pdf.setFontSize(14);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text(title, this.margin, this.currentY + 5);

    this.currentY += 20;
  }

  private addCoverPage(businessData: BusinessData): void {
    // Background gradient effect (simplified)
    this.pdf.setFillColor(248, 250, 252);
    this.pdf.rect(0, 0, this.pageWidth, this.pageHeight, 'F');

    // Header logo area
    this.pdf.setFillColor(79, 70, 229);
    this.pdf.rect(0, 0, this.pageWidth, 60, 'F');

    // PromptReviews Logo Text
    this.pdf.setTextColor(255, 255, 255);
    this.pdf.setFontSize(24);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('PromptReviews', this.margin, 35);

    this.pdf.setFontSize(12);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.text('Google Business Optimizer', this.margin, 45);

    // Main title
    this.currentY = 90;
    this.pdf.setTextColor(DARK_GRAY);
    this.pdf.setFontSize(28);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Business Optimization Report', this.margin, this.currentY);

    this.currentY += 20;
    this.pdf.setFontSize(16);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setTextColor(PROMPTREVIEWS_BLUE);
    this.pdf.text(businessData.businessName || 'Your Business', this.margin, this.currentY);

    // Business info box
    this.currentY = 140;
    const boxY = this.currentY;
    const boxHeight = 60;

    this.pdf.setFillColor(255, 255, 255);
    this.pdf.setDrawColor(79, 70, 229);
    this.pdf.rect(this.margin, boxY, this.pageWidth - 2 * this.margin, boxHeight, 'FD');

    this.currentY = boxY + 15;
    this.pdf.setTextColor(DARK_GRAY);
    this.pdf.setFontSize(12);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Business Information', this.margin + 10, this.currentY);

    this.currentY += 12;
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'normal');

    const info = [
      `Industry: ${businessData.industry || 'Not specified'}`,
      `Company Size: ${businessData.companySize || 'Not specified'}`,
      `Contact: ${businessData.email}`,
      `Report Generated: ${new Date().toLocaleDateString()}`
    ];

    for (const line of info) {
      this.pdf.text(line, this.margin + 10, this.currentY);
      this.currentY += 8;
    }

    // Footer
    this.pdf.setTextColor(PROMPTREVIEWS_BLUE);
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'italic');
    this.pdf.text('Comprehensive analysis and actionable recommendations for your Google Business Profile',
                  this.margin, this.pageHeight - 30);

    this.pdf.addPage();
    this.currentY = this.margin;
  }

  private addExecutiveSummary(businessData: BusinessData, analysisData: AnalysisData): void {
    this.addSection('Executive Summary');

    this.addParagraph(
      `This comprehensive analysis of ${businessData.businessName || 'your business'}'s Google Business Profile reveals significant opportunities for growth and optimization. Based on current performance metrics and industry benchmarks, we've identified key areas where strategic improvements can drive measurable results.`
    );

    // Key metrics overview
    this.currentY += 10;
    this.addSubtitle('Performance Snapshot', 14, PROMPTREVIEWS_BLUE);

    // Create metrics row
    const startY = this.currentY;
    this.addMetricBox('Total Reviews', analysisData.totalReviews.toString(), GREEN);

    this.currentY = startY;
    this.addMetricBox('Avg Rating', `${analysisData.averageRating}/5`, analysisData.averageRating >= 4.5 ? GREEN : analysisData.averageRating >= 4.0 ? ORANGE : RED);

    // Move to next row
    this.currentY = startY + 35;
    this.addMetricBox('SEO Score', `${analysisData.seoScore}/100`, analysisData.seoScore >= 80 ? GREEN : analysisData.seoScore >= 60 ? ORANGE : RED);

    this.currentY = startY;
    this.addMetricBox('Monthly Views', analysisData.monthlyViews.toLocaleString(), PROMPTREVIEWS_BLUE);

    this.currentY = startY + 50;

    this.addParagraph(
      `Our analysis indicates that implementing the recommendations in this report could potentially increase your monthly profile views by 25-40% and improve your local search ranking position. The highest-impact opportunities include responding to unanswered reviews, optimizing your business description, and maintaining regular posting activity.`
    );
  }

  private addPerformanceMetrics(analysisData: AnalysisData): void {
    this.addSection('Current Performance Analysis');

    this.addSubtitle('Review Management Performance');
    this.addParagraph(
      `Your business currently has ${analysisData.totalReviews} total reviews with an average rating of ${analysisData.averageRating}/5. Industry benchmarks suggest that businesses with response rates above 90% see 15% higher conversion rates.`
    );

    if (analysisData.unrespondedReviews > 0) {
      this.addBulletPoint(`${analysisData.unrespondedReviews} reviews are waiting for responses (High Priority)`);
    }
    this.addBulletPoint(`Review velocity shows a ${analysisData.reviewTrend > 0 ? 'positive' : 'negative'} trend of ${Math.abs(analysisData.reviewTrend)}% month-over-month`);

    this.addSubtitle('Visibility & Discovery Metrics');
    this.addParagraph(
      `Your profile generated ${analysisData.monthlyViews.toLocaleString()} views last month, which is ${analysisData.viewsTrend > 0 ? 'up' : 'down'} ${Math.abs(analysisData.viewsTrend)}% from the previous period.`
    );

    this.addBulletPoint(`Search visibility is ${analysisData.seoScore >= 80 ? 'excellent' : analysisData.seoScore >= 60 ? 'good' : 'needs improvement'} with an SEO score of ${analysisData.seoScore}/100`);
    this.addBulletPoint(`Photo gallery contains ${analysisData.photoCount} images (recommended: 10-15 fresh photos monthly)`);

    if (analysisData.unansweredQuestions > 0) {
      this.addBulletPoint(`${analysisData.unansweredQuestions} customer questions need responses`);
    }
  }

  private getOptimizationOpportunities(): OptimizationOpportunity[] {
    return [
      {
        title: 'Respond to All Outstanding Reviews',
        description: 'Reply to unanswered reviews within 24 hours to maintain customer engagement and improve local search signals.',
        impact: '+15-20% conversion rate improvement',
        priority: 'high',
        estimatedTime: '30 minutes',
        category: 'Customer Engagement'
      },
      {
        title: 'Optimize Business Description with Keywords',
        description: 'Enhance your business description to include location-specific keywords and services to improve search visibility.',
        impact: '+10-15% local search ranking boost',
        priority: 'high',
        estimatedTime: '45 minutes',
        category: 'SEO Optimization'
      },
      {
        title: 'Add Fresh High-Quality Photos',
        description: 'Upload 8-10 new photos showcasing products, services, and team members to increase engagement.',
        impact: '+12% profile views increase',
        priority: 'medium',
        estimatedTime: '2 hours',
        category: 'Visual Content'
      },
      {
        title: 'Publish Weekly Google Posts',
        description: 'Create regular posts highlighting offers, events, and updates to stay visible in search results.',
        impact: '+8-12% discovery search increase',
        priority: 'medium',
        estimatedTime: '20 minutes weekly',
        category: 'Content Marketing'
      },
      {
        title: 'Complete All Business Attributes',
        description: 'Fill out all available business attributes to provide comprehensive information to potential customers.',
        impact: '+5-8% click-through rate improvement',
        priority: 'medium',
        estimatedTime: '1 hour',
        category: 'Profile Completeness'
      },
      {
        title: 'Add Products and Services Listings',
        description: 'Create detailed product/service listings with descriptions and pricing to capture more qualified leads.',
        impact: '+10-15% website clicks increase',
        priority: 'medium',
        estimatedTime: '3 hours',
        category: 'Service Marketing'
      },
      {
        title: 'Set Up Appointment Booking',
        description: 'Enable online appointment booking through your Google Business Profile for customer convenience.',
        impact: '+20-30% booking conversion rate',
        priority: 'high',
        estimatedTime: '2 hours',
        category: 'Customer Experience'
      },
      {
        title: 'Monitor and Respond to Q&A Section',
        description: 'Regularly check and respond to customer questions to provide helpful information and improve SEO.',
        impact: '+5-10% local search relevance boost',
        priority: 'low',
        estimatedTime: '15 minutes weekly',
        category: 'Customer Support'
      },
      {
        title: 'Implement Review Generation Strategy',
        description: 'Create a systematic approach to request reviews from satisfied customers after service completion.',
        impact: '+25-40% review volume increase',
        priority: 'high',
        estimatedTime: '4 hours setup',
        category: 'Review Management'
      },
      {
        title: 'Optimize Operating Hours and Special Hours',
        description: 'Ensure all operating hours are accurate and add special hours for holidays and events.',
        impact: '+3-5% direction requests increase',
        priority: 'low',
        estimatedTime: '30 minutes',
        category: 'Business Information'
      }
    ];
  }

  private addOptimizationOpportunities(): void {
    this.addSection('Optimization Opportunities');

    this.addParagraph(
      'Based on our analysis, we\'ve identified the following optimization opportunities ranked by potential impact and implementation priority. Each recommendation includes specific steps and expected outcomes.'
    );

    const opportunities = this.getOptimizationOpportunities();

    // Group by priority
    const highPriority = opportunities.filter(o => o.priority === 'high');
    const mediumPriority = opportunities.filter(o => o.priority === 'medium');
    const lowPriority = opportunities.filter(o => o.priority === 'low');

    // High Priority
    this.addSubtitle('🔴 High Priority Opportunities', 12, RED);
    for (const opp of highPriority) {
      this.checkPageBreak(30);

      this.pdf.setTextColor(DARK_GRAY);
      this.pdf.setFontSize(11);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text(`${opp.title}`, this.margin + 5, this.currentY);
      this.currentY += 8;

      this.pdf.setFontSize(9);
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.setTextColor(GREEN);
      this.pdf.text(`Impact: ${opp.impact} | Time: ${opp.estimatedTime}`, this.margin + 5, this.currentY);
      this.currentY += 8;

      this.pdf.setTextColor(DARK_GRAY);
      const descLines = this.pdf.splitTextToSize(opp.description, this.pageWidth - 2 * this.margin - 10);
      for (const line of descLines) {
        this.pdf.text(line, this.margin + 5, this.currentY);
        this.currentY += 6;
      }
      this.currentY += 8;
    }

    // Medium Priority
    this.addSubtitle('🟡 Medium Priority Opportunities', 12, ORANGE);
    for (const opp of mediumPriority) {
      this.checkPageBreak(25);

      this.pdf.setTextColor(DARK_GRAY);
      this.pdf.setFontSize(11);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text(`${opp.title}`, this.margin + 5, this.currentY);
      this.currentY += 8;

      this.pdf.setFontSize(9);
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.setTextColor(GREEN);
      this.pdf.text(`Impact: ${opp.impact} | Time: ${opp.estimatedTime}`, this.margin + 5, this.currentY);
      this.currentY += 8;

      this.pdf.setTextColor(DARK_GRAY);
      const descLines = this.pdf.splitTextToSize(opp.description, this.pageWidth - 2 * this.margin - 10);
      for (const line of descLines) {
        this.pdf.text(line, this.margin + 5, this.currentY);
        this.currentY += 6;
      }
      this.currentY += 8;
    }

    // Low Priority (abbreviated)
    this.addSubtitle('🟢 Additional Opportunities', 12, GREEN);
    for (const opp of lowPriority) {
      this.checkPageBreak(15);

      this.pdf.setTextColor(DARK_GRAY);
      this.pdf.setFontSize(10);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text(`• ${opp.title}`, this.margin + 5, this.currentY);
      this.currentY += 6;

      this.pdf.setFontSize(9);
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.setTextColor(GREEN);
      this.pdf.text(`${opp.impact} (${opp.estimatedTime})`, this.margin + 15, this.currentY);
      this.currentY += 10;
    }
  }

  private addActionPlan(): void {
    this.addSection('30-Day Action Plan');

    this.addParagraph(
      'Follow this prioritized roadmap to maximize your Google Business Profile optimization results. We recommend focusing on high-impact, quick-win opportunities first.'
    );

    const actionItems = [
      {
        week: 'Week 1',
        color: RED,
        tasks: [
          'Respond to all outstanding reviews (Day 1-2)',
          'Update business description with target keywords (Day 3)',
          'Verify all business information is accurate (Day 4)',
          'Upload 5 high-quality recent photos (Day 5-7)'
        ]
      },
      {
        week: 'Week 2',
        color: ORANGE,
        tasks: [
          'Set up appointment booking system',
          'Create first Google Post with current promotion',
          'Add detailed product/service listings',
          'Complete all available business attributes'
        ]
      },
      {
        week: 'Week 3',
        color: PROMPTREVIEWS_BLUE,
        tasks: [
          'Implement review generation strategy',
          'Create weekly posting schedule',
          'Monitor and respond to new Q&A',
          'Upload 5 more fresh photos'
        ]
      },
      {
        week: 'Week 4',
        color: GREEN,
        tasks: [
          'Analyze performance improvements',
          'Adjust strategy based on results',
          'Plan next month\'s content calendar',
          'Set up ongoing monitoring system'
        ]
      }
    ];

    for (const week of actionItems) {
      this.checkPageBreak(35);

      this.pdf.setFillColor(week.color);
      this.pdf.rect(this.margin, this.currentY, 4, 6, 'F');

      this.pdf.setTextColor(week.color);
      this.pdf.setFontSize(12);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text(week.week, this.margin + 8, this.currentY + 4);

      this.currentY += 12;

      for (const task of week.tasks) {
        this.addBulletPoint(task, 9);
      }
      this.currentY += 5;
    }

    this.addSubtitle('Success Metrics to Track', 12, PROMPTREVIEWS_BLUE);
    const metrics = [
      'Profile views (target: +25% month-over-month)',
      'Review response rate (target: 100% within 24 hours)',
      'Average rating maintenance (target: 4.5+ stars)',
      'Direction requests (target: +15% increase)',
      'Website clicks (target: +20% increase)',
      'Phone calls (target: +10% increase)'
    ];

    for (const metric of metrics) {
      this.addBulletPoint(metric, 9);
    }
  }

  private addFooter(): void {
    this.checkPageBreak(50);

    // Separator line
    this.pdf.setDrawColor(79, 70, 229);
    this.pdf.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    this.currentY += 15;

    this.addTitle('About PromptReviews', 14, PROMPTREVIEWS_BLUE);

    this.addParagraph(
      'PromptReviews helps businesses optimize their online presence and manage customer reviews effectively. Our Google Business Optimizer tool provides data-driven insights to improve local search visibility and customer engagement.'
    );

    this.addSubtitle('Ready to Implement These Recommendations?');
    this.addParagraph(
      'Get personalized guidance and automation tools to implement these optimizations faster. Contact our team for a consultation or start your free trial today.'
    );

    // Contact information
    this.pdf.setFillColor(248, 250, 252);
    this.pdf.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 25, 'F');

    this.currentY += 8;
    this.pdf.setTextColor(PROMPTREVIEWS_BLUE);
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Contact Information:', this.margin + 5, this.currentY);

    this.currentY += 8;
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setTextColor(DARK_GRAY);
    this.pdf.text('Website: app.promptreviews.app', this.margin + 5, this.currentY);
    this.pdf.text('Email: support@promptreviews.app', this.margin + 80, this.currentY);

    this.currentY += 8;
    this.pdf.setFontSize(8);
    this.pdf.setTextColor(PROMPTREVIEWS_BLUE);
    this.pdf.text(`Report generated on ${new Date().toLocaleString()} | © 2025 PromptReviews`,
                  this.margin + 5, this.currentY);
  }

  public generateReport(
    businessData: BusinessData,
    analysisData: AnalysisData
  ): Uint8Array {
    // Cover Page
    this.addCoverPage(businessData);

    // Executive Summary
    this.addExecutiveSummary(businessData, analysisData);

    // Performance Analysis
    this.addPerformanceMetrics(analysisData);

    // Optimization Opportunities
    this.addOptimizationOpportunities();

    // Action Plan
    this.addActionPlan();

    // Footer/Contact
    this.addFooter();

    // Return PDF as Uint8Array
    return this.pdf.output('arraybuffer') as Uint8Array;
  }

  public generateReportBlob(
    businessData: BusinessData,
    analysisData: AnalysisData
  ): Blob {
    const pdfData = this.generateReport(businessData, analysisData);
    return new Blob([pdfData], { type: 'application/pdf' });
  }
}

// Utility function to create sample data for testing
export function createSampleAnalysisData(): AnalysisData {
  return {
    totalReviews: 247,
    averageRating: 4.7,
    reviewTrend: 23,
    monthlyViews: 12400,
    viewsTrend: 12,
    unrespondedReviews: 8,
    unansweredQuestions: 2,
    seoScore: 82,
    photoCount: 35
  };
}