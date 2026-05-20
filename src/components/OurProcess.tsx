"use client";

import { motion } from "framer-motion";
import Image from "next/image";

const steps = [
  {
    step: "01",
    title: "Grain Selection",
    description: "We source the finest non-GMO corn, rye, and malted barley from Kentucky farms within 50 miles of our distillery.",
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80",
  },
  {
    step: "02",
    title: "Mashing & Fermentation",
    description: "Our sour mash process uses limestone-filtered water and a proprietary yeast strain cultivated since 1876.",
    image: "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=600&q=80",
  },
  {
    step: "03",
    title: "Copper Pot Distillation",
    description: "Double distilled in hand-hammered copper pot stills, capturing only the heart of the spirit.",
    image: "https://images.unsplash.com/photo-1614313511387-1436a4480ebb?w=600&q=80",
  },
  {
    step: "04",
    title: "Barrel Aging",
    description: "Aged in new charred American white oak barrels in our seven-story rickhouse, where Kentucky seasons work their magic.",
    image: "https://images.unsplash.com/photo-1609951651556-5334e2706168?w=600&q=80",
  },
];

export default function OurProcess() {
  return (
    <section id="process" className="py-14 sm:py-24 bg-bourbon-deep relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-20"
        >
          <span className="text-bourbon-gold text-[10px] sm:text-xs tracking-[0.3em] uppercase">
            Craftsmanship
          </span>
          <h2 className="font-[family-name:var(--font-playfair)] text-3xl sm:text-4xl md:text-5xl font-bold text-bourbon-cream mt-3 mb-4">
            From Grain to Glass
          </h2>
          <div className="w-16 sm:w-20 h-0.5 bg-bourbon-gold mx-auto mb-4" />
          <p className="text-bourbon-cream/50 text-sm sm:text-base max-w-2xl mx-auto">
            Every drop of Bourbon & Oak is the result of a meticulous process
            refined over six generations.
          </p>
        </motion.div>

        {/* Process steps */}
        <div className="space-y-12 sm:space-y-24">
          {steps.map((step, i) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7 }}
              className={`flex flex-col ${
                i % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"
              } items-center gap-6 sm:gap-12`}
            >
              {/* Image */}
              <div className="flex-1 w-full">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.4 }}
                  className="relative h-56 sm:h-80 lg:h-96 overflow-hidden"
                >
                  <Image
                    src={step.image}
                    alt={step.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-bourbon-deep/20" />
                  {/* Step number overlay */}
                  <div className="absolute top-4 left-4 sm:top-6 sm:left-6">
                    <span className="font-[family-name:var(--font-playfair)] text-5xl sm:text-6xl font-bold text-bourbon-gold/30">
                      {step.step}
                    </span>
                  </div>
                </motion.div>
              </div>

              {/* Content */}
              <div className="flex-1 w-full">
                <span className="text-bourbon-gold text-[10px] sm:text-xs tracking-[0.3em] uppercase">
                  Step {step.step}
                </span>
                <h3 className="font-[family-name:var(--font-playfair)] text-2xl sm:text-3xl md:text-4xl font-bold text-bourbon-cream mt-2 mb-4">
                  {step.title}
                </h3>
                <div className="w-12 h-0.5 bg-bourbon-gold mb-4 sm:mb-6" />
                <p className="text-bourbon-cream/60 text-sm sm:text-lg leading-relaxed">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <span className="font-[family-name:var(--font-playfair)] text-[20rem] font-bold text-bourbon-cream/[0.01] uppercase leading-none">
          OAK
        </span>
      </div>
    </section>
  );
}
