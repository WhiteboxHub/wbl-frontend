"use client";

import SectionTitle from "../Common/SectionTitle";
import SingleFeature from "./SingleFeature";
import featuresData from "./featuresData";
import { useAuth } from "@/utils/AuthContext";

const Features = () => {
  const { isAuthenticated } = useAuth();

  return (
    <>
      <section
        id="features"
        className="bg-primary/[.03] py-12 md:py-16 scroll-mt-20 dark:bg-[#161a3d]"
      >
        <div className="container">
          <SectionTitle
            title="What is Whitebox Learning?"
            paragraph="Whitebox Learning (WBL) is a classroom and online based training for Engineers and Machine Learning enthusiasts."
            center
            mb="40px"
          />

          <div className="grid grid-cols-1 gap-x-8 gap-y-8 md:grid-cols-2 md:gap-y-10 lg:grid-cols-3">
            {featuresData.map((feature) => (
              <SingleFeature key={feature.id} feature={feature} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default Features;
