import { Feature } from "@/types/feature";

const SingleFeature = ({ feature }: { feature: Feature }) => {
  const { icon, title, paragraph } = feature;
  return (
    <div className="w-full">
      <div className="wow fadeInUp" data-wow-delay=".15s">
        <div className="mb-5 flex h-[52px] w-[52px] items-center justify-center rounded-xl bg-primary bg-opacity-10 text-primary">
          {icon}
        </div>
        <h3 className="mb-2.5 text-base sm:text-lg font-bold text-black dark:text-white">
          {title}
        </h3>
        <p className="pr-[10px] text-xs sm:text-sm font-normal leading-relaxed text-body-color">
          {paragraph}
        </p>
      </div>
    </div>
  );
};

export default SingleFeature;
