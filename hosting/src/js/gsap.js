document.addEventListener("DOMContentLoaded", () => {
  let split = SplitText.create("#text-animation", { type: "words, chars" });

  gsap.from("#kaiser-magnum", {
    duration: 1.2,
    x: 0, // Resetting x to 0 since there's no horizontal scroll
    y: 0, // No need for y offset on vertical layout
    autoAlpha: 0,
    ease: "expo.out",
    scrollTrigger: {
      trigger: "#kaiser-magnum",
      start: "top 80%", // Adjusted trigger to fire on vertical scroll
      toggleActions: "restart none reverse none",
    }
  });

  gsap.from("#yt-video", {
    duration: 1.2,
    x: 0, // Resetting x to 0
    y: 0, // No need for y offset on vertical layout
    autoAlpha: 0,
    ease: "expo.out",
    scrollTrigger: {
      trigger: "#yt-video",
      start: "top 80%", // Adjusted trigger to fire on vertical scroll
      toggleActions: "restart none reverse none",
    }
  });

  gsap.from(".catalogue .card .card-text p", {
    duration: 0.6,
    y: 60,
    autoAlpha: 0,
    stagger: 0.08,
    ease: "power3.out",
    scrollTrigger: {
      trigger: ".catalogue .card .card-text p",
      start: "top 90%",
      toggleActions: "restart none reverse none",
    }
  });

  gsap.from("#ready", {
    duration: 1,
    y: 200,
    autoAlpha: 0,
    stagger: 0.2,
    ease: "power4.out",
    scrollTrigger: {
      trigger: "#ready",
      start: "top 90%",
      toggleActions: "restart none reverse none",
    }
  });

  gsap.from("#ego", {
    duration: 1.5,
    y: 100,
    scale: 0,
    autoAlpha: 0,
    stagger: 0.2,
    ease: "power1.inOut",
    scrollTrigger: {
      trigger: "#ego",
      start: "top 90%",
      toggleActions: "restart none reverse none",
    }
  });

  gsap.registerPlugin(ScrollTrigger);

  gsap.from(split.chars, {
    duration: 1.5,
    y: 100,
    autoAlpha: 0,
    ease: "back.out(0.5)",
    stagger: {
      amount: 0.5,
      from: "random"
    },
    scrollTrigger: {
      trigger: "#ready",
      start: "top 90%",
      toggleActions: "restart none reverse none",
    }
  });

  // Removed the horizontal scroll GSAP code as it is no longer needed.
});