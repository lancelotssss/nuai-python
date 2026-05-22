import { useEffect, useCallback, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Autoplay from "embla-carousel-autoplay";
import {
  motion,
  useInView,
  useMotionValue,
  useTransform,
  animate,
  AnimatePresence,
} from "framer-motion";
import { BriefcaseBusiness, Users, Megaphone, BarChart3 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Separator } from "@/components/ui/separator";

import Header from "../../components/Header";
import Footer from "../../components/Footer";
import PageTitle from "../../components/PageTitle";

import NULogoCapBlue from "../../assets/alumni-login/nuai-logo-blue.png";
import NULogoCapWhite from "../../assets/alumni-login/nuai-logo-white.png";
import FooterLogo from "../../assets/cropped-blue.png";
import ServicesAlumniIcon from "../../assets/services-alumni.png";
import ServicesInternshipIcon from "../../assets/services-internships.png";
import ServicesJobIcon from "../../assets/services-job.png";

import NU5 from "../../assets/schools/nu5.jpg";

import { HexagonPattern } from "../../components/ui/hexagon-pattern";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: "easeOut" },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

function AnimatedNumber({ value, suffix = "", duration = 2 }) {
  const ref = useRef(null);
  const motionVal = useMotionValue(0);
  const rounded = useTransform(motionVal, (v) =>
    Math.round(v).toLocaleString(),
  );
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    if (!isInView) return;

    const controls = animate(motionVal, value, {
      duration,
      ease: "easeOut",
    });

    const unsub = rounded.on("change", (v) => setDisplay(v));

    return () => {
      controls.stop();
      unsub();
    };
  }, [isInView, value, duration, motionVal, rounded]);

  return (
    <span ref={ref}>
      {display}
      {suffix}
    </span>
  );
}

const heroSlides = [
  {
    badge: "Alumni Portal",
    title: "Stay connected beyond graduation",
    body: "Access announcements, career resources, and alumni services — all in one centralized platform built for the NU community.",
  },
  {
    badge: "Career Hub",
    title: "Discover opportunities tailored for you",
    body: "Browse internships and job postings from trusted partner companies, curated specifically for NU alumni and interns.",
  },
  {
    badge: "Community",
    title: "A lifelong network starts here",
    body: "Engage with fellow graduates, participate in surveys, and stay informed with the latest university updates and events.",
  },
  {
    badge: "Platform",
    title: "Built for the modern NU graduate",
    body: "From profile management to real-time notifications — NUAI delivers the tools alumni need to thrive after campus life.",
  },
];

const features = [
  {
    icon: Users,
    title: "Alumni Directory",
    desc: "Search and connect with thousands of NU graduates across different programs and batch years.",
  },
  {
    icon: BriefcaseBusiness,
    title: "Job & Internship Board",
    desc: "Explore verified career opportunities posted by partner employers and university-endorsed organizations.",
  },
  {
    icon: Megaphone,
    title: "Announcements",
    desc: "Receive real-time updates on events, policy changes, and alumni engagement activities from the university.",
  },
  {
    icon: BarChart3,
    title: "Alumni Surveys",
    desc: "Participate in university research and tracer studies that help improve programs for future Nationalians.",
  },
];

const stats = [
  { value: 50000, suffix: "+", label: "Registered Alumni" },
  { value: 120, suffix: "+", label: "Partner Companies" },
  { value: 15, suffix: "", label: "Academic Programs" },
  { value: 98, suffix: "%", label: "Graduate Employability" },
];

const services = [
  {
    icon: ServicesAlumniIcon,
    title: "Alumni Network",
    desc: "Connect with fellow graduates and expand your professional network across industries.",
  },
  {
    icon: ServicesInternshipIcon,
    title: "Internship Placements",
    desc: "Find university-endorsed internship programs matched to your academic specialization.",
  },
  {
    icon: ServicesJobIcon,
    title: "Job Opportunities",
    desc: "Browse verified career openings from partner companies actively seeking NU talent.",
  },
];

const journeyCards = [
  {
    title: "Stay Connected",
    desc: "Receive announcements, events, and updates from the university and alumni community.",
  },
  {
    title: "Explore Opportunities",
    desc: "Find career, internship, and partner-supported opportunities designed for Nationalians.",
  },
  {
    title: "Access Services",
    desc: "Use alumni and career-related services that support your growth beyond campus.",
  },
  {
    title: "Build Your Profile",
    desc: "Keep your information updated so the university can support your alumni journey better.",
  },
  {
    title: "Support Career Growth",
    desc: "Discover resources, job posts, and programs that help alumni and interns move forward.",
  },
  {
    title: "Connect with Partners",
    desc: "Bridge NU talent with partner companies looking for interns, graduates, and professionals.",
  },
  {
    title: "Share Your Progress",
    desc: "Contribute to surveys and tracer studies that help improve university programs.",
  },
  {
    title: "Grow Partnerships",
    desc: "Support stronger university-industry connections through meaningful career opportunities.",
  },
];

function JourneyCard({ item }) {
  return (
    <Card className="h-[118px] min-w-[310px] max-w-[310px] select-none border-black/8 bg-white py-0 shadow-sm">
      <CardContent className="flex h-full flex-col justify-center px-5 py-4">
        <h3 className="text-[13px] font-bold text-nu-blue">{item.title}</h3>

        <p className="mt-1.5 text-[11px] leading-5 text-nu-muted">
          {item.desc}
        </p>
      </CardContent>
    </Card>
  );
}

function JourneyMarquee() {
  const marqueeItems = [...journeyCards, ...journeyCards];

  return (
    <div className="relative mt-8 select-none overflow-hidden">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-nu-bg to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-nu-bg to-transparent" />

      <motion.div
        className="flex w-max gap-4 py-1"
        animate={{ x: ["0%", "-50%"] }}
        transition={{
          duration: 34,
          ease: "linear",
          repeat: Infinity,
        }}
      >
        {marqueeItems.map((item, idx) => (
          <JourneyCard key={`${item.title}-${idx}`} item={item} />
        ))}
      </motion.div>
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [carouselApi, setCarouselApi] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setPageLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  const onSelect = useCallback(() => {
    if (!carouselApi) return;
    setCurrentSlide(carouselApi.selectedScrollSnap());
  }, [carouselApi]);

  useEffect(() => {
    if (!carouselApi) return;

    onSelect();
    carouselApi.on("select", onSelect);

    return () => carouselApi.off("select", onSelect);
  }, [carouselApi, onSelect]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-white">
      <PageTitle title="Home | NUAI" />

      <AnimatePresence>
        {pageLoading && (
          <motion.div
            key="loader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="fixed inset-0 z-100 flex min-h-screen items-center justify-center bg-slate-50"
          >
            <div className="flex flex-col items-center">
              <div className="relative flex h-48 w-48 items-center justify-center">
                <span className="absolute h-48 w-48 animate-ping rounded-full border border-nu-blue/10" />
                <span className="absolute h-32 w-32 rounded-full border border-nu-blue/20" />

                <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-nu-blue/10">
                  <img
                    src={NULogoCapWhite}
                    alt="NUAI Logo"
                    className="h-16 w-16 object-contain"
                  />
                </div>
              </div>

              <div className="mt-12 text-center">
                <h2 className="text-xl font-semibold text-nu-blue">
                  Welcome to NUAI
                </h2>

                <p className="mt-2 text-base text-slate-500">
                  Preparing the alumni portal for you.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Header logoSrc={NULogoCapBlue} homeTo="/" />

      <section className="overflow-hidden bg-white py-20 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-bold text-nu-blue md:text-3xl">
                A platform built for the NU community
              </h2>

              <p className="mt-4 text-sm leading-7 text-nu-muted md:text-base">
                NUAI connects alumni, interns, and industry partners in one
                unified system—streamlining opportunities, communication, and
                university services to support your journey beyond campus.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button
                  size="lg"
                  onClick={() => navigate("/login")}
                  className="h-11 w-full cursor-pointer bg-nu-blue px-8 font-semibold text-white hover:bg-nu-blue/90 sm:w-56"
                >
                  LOGIN
                </Button>
              </div>
            </div>

            <div className="relative">
              <img
                src={NU5}
                alt="NU campus"
                className="w-full rounded-xl shadow-md"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-nu-blue">
        <div className="pointer-events-none absolute inset-0">
          <HexagonPattern className="h-full w-full opacity-[0.58]" />
        </div>

        <div className="pointer-events-none absolute inset-0 bg-nu-blue/30 backdrop-blur-[1px]" />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="mx-auto max-w-6xl px-6 py-16 md:py-14"
        >
          <div className="relative">
            <Carousel
              opts={{ loop: true, align: "center" }}
              plugins={[Autoplay({ delay: 5500, stopOnInteraction: false })]}
              setApi={setCarouselApi}
              className="w-full overflow-hidden"
            >
              <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)] [-webkit-mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
                <CarouselContent>
                  {heroSlides.map((slide) => (
                    <CarouselItem key={slide.title}>
                      <div className="group mx-auto max-w-3xl cursor-pointer select-none text-center transition-transform duration-300 hover:-translate-y-0.5">
                        <Badge className="mb-4 border-nu-gold/40 bg-nu-gold/20 text-nu-gold hover:bg-nu-gold/30">
                          {slide.badge}
                        </Badge>

                        <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-white transition-colors duration-300 group-hover:text-white/95 sm:text-4xl md:text-[2.75rem]">
                          {slide.title}
                        </h1>

                        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/80 transition-colors duration-300 group-hover:text-white/90 md:text-[15px] md:leading-7">
                          {slide.body}
                        </p>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </div>
            </Carousel>

            <div className="mt-6 flex justify-center gap-2">
              {heroSlides.map((slide, idx) => (
                <button
                  key={slide.title}
                  onClick={() => carouselApi?.scrollTo(idx)}
                  aria-label={`Go to slide ${idx + 1}`}
                  className={`h-2 cursor-pointer rounded-full transition-all duration-300 ${
                    idx === currentSlide
                      ? "w-2 bg-nu-gold"
                      : "w-2 bg-white/30 hover:bg-white/50"
                  }`}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={staggerContainer}
        className="overflow-hidden bg-white py-20"
      >
        <div className="mx-auto max-w-6xl px-6">
          <motion.div variants={fadeUp} className="flex items-center gap-4">
            <h2 className="whitespace-nowrap text-xl font-extrabold text-nu-blue md:text-2xl">
              Built for every part of the NUAI community
            </h2>

            <Separator className="bg-nu-gold/50" />
          </motion.div>

          <motion.p
            variants={fadeUp}
            className="mt-3 max-w-3xl text-sm leading-7 text-nu-muted md:text-base"
          >
            NUAI is designed to support meaningful connections across the NU MOA
            community—bringing together alumni, interns, and partner
            organizations in one platform built for engagement, opportunity, and
            long-term growth.
          </motion.p>

          <div className="mt-14 space-y-20">
            <motion.div
              variants={fadeUp}
              custom={0}
              className="grid items-center gap-10 lg:grid-cols-[1.1fr_.9fr]"
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-nu-gold">
                  For Alumni
                </p>

                <h3 className="mt-3 text-2xl font-bold tracking-tight text-nu-blue md:text-3xl">
                  Continue your journey with the university that shaped you
                </h3>

                <p className="mt-4 max-w-2xl text-sm leading-7 text-nu-muted md:text-base">
                  Stay updated with university announcements, explore career
                  opportunities, access alumni-focused services, and remain part
                  of a growing network of Nationalians beyond graduation. NUAI
                  helps alumni stay engaged, informed, and connected to the
                  community.
                </p>
              </div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="lg:pl-8"
              >
                <div className="border-l-2 border-nu-gold/40 pl-5">
                  <h4 className="mt-4 text-base font-semibold text-nu-blue">
                    What alumni can do
                  </h4>

                  <ul className="mt-4 space-y-3 text-sm text-nu-muted">
                    <li className="flex items-start gap-3">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-nu-gold" />
                      <span>
                        Receive important university announcements and updates.
                      </span>
                    </li>

                    <li className="flex items-start gap-3">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-nu-gold" />
                      <span>
                        Explore career opportunities shared through the
                        platform.
                      </span>
                    </li>

                    <li className="flex items-start gap-3">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-nu-gold" />
                      <span>Stay involved in the NU MOA alumni community.</span>
                    </li>
                  </ul>
                </div>
              </motion.div>
            </motion.div>

            <motion.div
              variants={fadeUp}
              custom={1}
              className="grid items-center gap-10 lg:grid-cols-[.9fr_1.1fr]"
            >
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="order-2 lg:order-1 lg:pr-8"
              >
                <div className="border-l-2 border-nu-gold/40 pl-5">
                  <h4 className="mt-4 text-base font-semibold text-nu-blue">
                    What interns can access
                  </h4>

                  <ul className="mt-4 space-y-3 text-sm text-nu-muted">
                    <li className="flex items-start gap-3">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-nu-gold" />
                      <span>
                        Browse internship listings aligned with your academic
                        path.
                      </span>
                    </li>

                    <li className="flex items-start gap-3">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-nu-gold" />
                      <span>
                        Stay updated on placement-related announcements.
                      </span>
                    </li>

                    <li className="flex items-start gap-3">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-nu-gold" />
                      <span>
                        Connect with opportunities that support career
                        readiness.
                      </span>
                    </li>
                  </ul>
                </div>
              </motion.div>

              <div className="order-1 lg:order-2">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-nu-gold">
                  For Interns
                </p>

                <h3 className="mt-3 text-2xl font-bold tracking-tight text-nu-blue md:text-3xl">
                  Take the next step from academic learning to professional
                  growth
                </h3>

                <p className="mt-4 max-w-2xl text-sm leading-7 text-nu-muted md:text-base">
                  NUAI helps interns access opportunities that align with their
                  academic path while staying informed about placements,
                  employer connections, and internship-related updates. It is a
                  platform built to support students as they move closer to
                  their careers.
                </p>
              </div>
            </motion.div>

            <motion.div
              variants={fadeUp}
              custom={2}
              className="grid items-center gap-10 lg:grid-cols-[1.1fr_.9fr]"
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-nu-gold">
                  For Partner Organizations
                </p>

                <h3 className="mt-3 text-2xl font-bold tracking-tight text-nu-blue md:text-3xl">
                  Connect with NU talent and build stronger university
                  partnerships
                </h3>

                <p className="mt-4 max-w-2xl text-sm leading-7 text-nu-muted md:text-base">
                  Through NUAI, partner organizations can reach qualified alumni
                  and interns, share opportunities, and strengthen their
                  presence within the NU MOA community. The platform creates a
                  dedicated space for collaboration, recruitment, and long-term
                  engagement.
                </p>
              </div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="lg:pl-8"
              >
                <div className="border-l-2 border-nu-gold/40 pl-5">
                  <h4 className="mt-4 text-base font-semibold text-nu-blue">
                    What partners can do
                  </h4>

                  <ul className="mt-4 space-y-3 text-sm text-nu-muted">
                    <li className="flex items-start gap-3">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-nu-gold" />
                      <span>Reach qualified NU MOA alumni and interns.</span>
                    </li>

                    <li className="flex items-start gap-3">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-nu-gold" />
                      <span>
                        Share job and internship opportunities through the
                        platform.
                      </span>
                    </li>

                    <li className="flex items-start gap-3">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-nu-gold" />
                      <span>
                        Strengthen collaboration with the university community.
                      </span>
                    </li>
                  </ul>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        variants={staggerContainer}
        className="overflow-hidden bg-nu-bg py-16"
      >
        <div className="mx-auto max-w-6xl px-6">
          <motion.div variants={fadeUp} className="flex items-center gap-4">
            <h2 className="whitespace-nowrap text-xl font-extrabold text-nu-blue md:text-2xl">
              Platform Features
            </h2>

            <Separator className="bg-nu-gold/50" />
          </motion.div>

          <motion.p
            variants={fadeUp}
            className="mt-2 max-w-xl text-sm text-nu-muted"
          >
            A comprehensive suite of tools built to support alumni engagement,
            career development, and university connection.
          </motion.p>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feat, idx) => {
              const Icon = feat.icon;

              return (
                <motion.div key={feat.title} variants={fadeUp} custom={idx}>
                  <Card className="h-full border-black/8 bg-white py-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                    <CardContent className="flex flex-col gap-3 py-6">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-nu-blue/8">
                        <Icon className="size-5 text-nu-blue" />
                      </div>

                      <h3 className="font-bold text-nu-blue">{feat.title}</h3>

                      <p className="text-xs leading-6 text-nu-muted">
                        {feat.desc}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.section>

      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        variants={staggerContainer}
        className="overflow-hidden bg-white py-16"
      >
        <div className="mx-auto max-w-6xl px-6">
          <motion.div variants={fadeUp} className="flex items-center gap-4">
            <h2 className="whitespace-nowrap text-xl font-extrabold text-nu-blue md:text-2xl">
              Available Services
            </h2>

            <Separator className="bg-nu-gold/50" />
          </motion.div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((svc, idx) => (
              <motion.div key={svc.title} variants={fadeUp} custom={idx}>
                <Card className="h-full border-black/8 bg-nu-card py-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
                  <CardContent className="flex items-center gap-4 py-5">
                    <img
                      src={svc.icon}
                      alt={svc.title}
                      className="h-10 w-10 object-contain"
                    />

                    <div>
                      <p className="font-semibold text-nu-blue">{svc.title}</p>

                      <p className="mt-0.5 text-xs leading-5 text-nu-muted">
                        {svc.desc}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={staggerContainer}
        className="overflow-hidden bg-nu-blue py-14"
      >
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat, idx) => (
              <motion.div
                key={stat.label}
                variants={fadeUp}
                custom={idx}
                className="text-center"
              >
                <p className="text-3xl font-extrabold text-nu-gold md:text-4xl">
                  <AnimatedNumber
                    value={stat.value}
                    suffix={stat.suffix}
                    duration={2.2}
                  />
                </p>

                <p className="mt-1 text-sm text-white/75">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      <section className="overflow-hidden bg-nu-bg py-16">
        <div className="mx-auto max-w-[88rem] px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <h2 className="whitespace-nowrap text-xl font-extrabold text-nu-blue md:text-2xl">
              Start Your NUAI Journey
            </h2>

            <Separator className="bg-nu-gold/50" />
          </div>

          <p className="mt-2 max-w-3xl text-sm leading-7 text-nu-muted md:text-base">
            Access opportunities, updates, and services built for the NU MOA
            community—all through one secure platform.
          </p>

          <JourneyMarquee />

        </div>
      </section>

      <Footer logoSrc={FooterLogo} />
    </div>
  );
}
