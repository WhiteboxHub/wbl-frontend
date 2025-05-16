import { Menu } from "@/types/menu";

const menuData: Menu[] = [
  {
    id: 1,
    title: "Home",
    path: "/",
    newTab: false,
  },
  {
    id: 3,
    title: "Schedule",
    path: "/schedule",
    newTab: false,
  },
  {
    id: 4,
    title: "Resources",
    newTab: false,
    submenu: [
      {
        id: 41,
        title: "Recordings ",
        path: "/recording",
        newTab: false,
      },
      {
        id: 42,
        title: "Presentation ",
        path: "/presentation",
        newTab: false,
      },
      {
        id: 43,
        title: "Resume ",
        path: "/resume",
        newTab: false,
      },
    ],
  },
  {
    id: 5,
    title: "FAQ",
    path: "/faq",
    newTab: false,
  },
  {
    id: 6,
    title: "Contact",
    path: "/contact",
    newTab: false,
  },
];
export default menuData;
