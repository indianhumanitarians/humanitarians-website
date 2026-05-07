import { useEffect, useState, type KeyboardEvent } from "react";
import { useMentorshipTestimonials } from "../../hooks/useMentorshipTestimonials";
import type { MentorshipTestimonial } from "../../types/stats";
import { PrivacyNote } from "../common/PrivacyNote";

const emptyMessage = "Mentee testimonials will appear here after consent and verification.";

const TestimonialCard = ({ testimonial }: { testimonial: MentorshipTestimonial }) => {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(testimonial.profile_image_url) && !imageFailed;

  return (
    <article className="testimonial-card">
      <div className="testimonial-media" aria-hidden={!showImage}>
        {showImage ? (
          <img
            src={testimonial.profile_image_url}
            alt={testimonial.profile_image_alt || `Profile image for ${testimonial.anonymized_name}`}
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <span>{testimonial.anonymized_name.slice(0, 1).toUpperCase()}</span>
        )}
      </div>
      <div className="testimonial-content">
        <div className="badge-row">
          <span className="badge">{testimonial.mentorship_track}</span>
          <span className="badge muted">{testimonial.mentee_stage}</span>
        </div>
        <h3>{testimonial.anonymized_name}</h3>
        <p className="case-meta">
          {testimonial.public_role} · {testimonial.public_location} · {testimonial.period_label}
        </p>
        <p className="testimonial-outcome">{testimonial.outcome_summary}</p>
        <blockquote>{testimonial.testimonial_text}</blockquote>
        <p className="testimonial-tagline">{testimonial.carousel_tagline}</p>
      </div>
    </article>
  );
};

export const MentorshipTestimonialsCarousel = () => {
  const { testimonials, loading } = useMentorshipTestimonials();
  const [activeIndex, setActiveIndex] = useState(0);
  const hasMultipleTestimonials = testimonials.length > 1;

  useEffect(() => {
    setActiveIndex(0);
  }, [testimonials]);

  const showPrevious = () => {
    setActiveIndex((currentIndex) => (currentIndex - 1 + testimonials.length) % testimonials.length);
  };

  const showNext = () => {
    setActiveIndex((currentIndex) => (currentIndex + 1) % testimonials.length);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft" && hasMultipleTestimonials) {
      event.preventDefault();
      showPrevious();
    }

    if (event.key === "ArrowRight" && hasMultipleTestimonials) {
      event.preventDefault();
      showNext();
    }
  };

  return (
    <section className="section testimonials-section">
      <div className="mentor-tracks-intro">
        <h2>Mentee stories</h2>
        <p>Public reflections from mentorship support, shared only after consent and verification.</p>
      </div>
      <PrivacyNote>Testimonials are anonymized and shown only after consent.</PrivacyNote>

      {loading ? <p className="soft-status">Loading mentorship testimonials...</p> : null}

      {testimonials.length > 0 ? (
        <div
          className="testimonial-carousel"
          aria-label="Mentorship testimonials carousel"
          tabIndex={0}
          onKeyDown={handleKeyDown}
        >
          <div className="testimonial-track" style={{ transform: `translateX(-${activeIndex * 100}%)` }}>
            {testimonials.map((testimonial) => (
              <TestimonialCard testimonial={testimonial} key={testimonial.testimonial_id} />
            ))}
          </div>

          {hasMultipleTestimonials ? (
            <>
              <button className="case-carousel-button previous" type="button" onClick={showPrevious} aria-label="Show previous testimonial">
                ‹
              </button>
              <button className="case-carousel-button next" type="button" onClick={showNext} aria-label="Show next testimonial">
                ›
              </button>
              <div className="case-carousel-dots" aria-label="Mentorship testimonial selector">
                {testimonials.map((testimonial, index) => (
                  <button
                    key={testimonial.testimonial_id}
                    type="button"
                    className={index === activeIndex ? "active" : undefined}
                    onClick={() => setActiveIndex(index)}
                    aria-label={`Show testimonial ${index + 1}`}
                  />
                ))}
              </div>
            </>
          ) : null}
        </div>
      ) : !loading ? (
        <div className="empty-chart-state">{emptyMessage}</div>
      ) : null}
    </section>
  );
};
