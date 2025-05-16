import { StaticImageData } from "next/image"

export type Testimonial = {
  id: number;
  name: string;
  designation: string;
  content: string;
  image: StaticImageData;
  star: number;
};
