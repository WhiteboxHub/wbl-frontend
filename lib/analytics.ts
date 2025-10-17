declare global {
  interface Window {
    gtag: (
      command: string,
      targetId: string | Date,
      config?: Record<string, any>
    ) => void;
    dataLayer: any[];
  }
}

export const GA_MEASUREMENT_ID = "G-BJ6C50SLVQ";

export const pageview = (url: string) => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("config", GA_MEASUREMENT_ID, {
      page_path: url,
    });
  }
};

export const trackEvent = ({
  action,
  category,
  label,
  value,
}: {
  action: string;
  category: string;
  label?: string;
  value?: number;
}) => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

export const trackFormSubmission = (formName: string) => {
  trackEvent({
    action: "form_submission",
    category: "engagement",
    label: formName,
  });
};

export const trackButtonClick = (buttonName: string) => {
  trackEvent({
    action: "button_click",
    category: "engagement",
    label: buttonName,
  });
};

export const trackOutboundLink = (url: string) => {
  trackEvent({
    action: "outbound_link_click",
    category: "engagement",
    label: url,
  });
};

export const trackCourseEnrollment = (courseName: string) => {
  trackEvent({
    action: "course_enrollment",
    category: "conversion",
    label: courseName,
  });
};

export const trackLogin = (method: string) => {
  trackEvent({
    action: "login",
    category: "user_engagement",
    label: method,
  });
};

export const trackSignup = (method: string) => {
  trackEvent({
    action: "signup",
    category: "conversion",
    label: method,
  });
};

export const trackContactForm = () => {
  trackEvent({
    action: "contact_form_submission",
    category: "lead_generation",
    label: "contact_page",
  });
};

export const trackReferral = () => {
  trackEvent({
    action: "referral_click",
    category: "engagement",
    label: "refer_and_earn",
  });
};

export const trackVideoPlay = (videoTitle: string) => {
  trackEvent({
    action: "video_play",
    category: "engagement",
    label: videoTitle,
  });
};
