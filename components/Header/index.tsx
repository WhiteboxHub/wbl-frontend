import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import ThemeToggler from "./ThemeToggler";
import menuData from "./menuData";
import WBLlight from "@/public/images/wbl-light.png";
import WBLdark from "@/public/images/wbl-dark.png";
import { useRouter } from "next/navigation";
import { useAuth } from "@/utils/AuthContext";

const Header = ({
  toggleSidebar,
  isOpen,
}: {
  toggleSidebar?: () => void;
  isOpen?: boolean;
}) => {
  const { isAuthenticated, logout, userRole } = useAuth();
  const router = useRouter();
  const [sticky, setSticky] = useState(false);
  const [navbarOpen, setNavbarOpen] = useState(false);
  const [openIndex, setOpenIndex] = useState(-1);

  const handleStickyNavbar = () => {
    setSticky(window.scrollY >= 80);
  };

  useEffect(() => {
    window.addEventListener("scroll", handleStickyNavbar);
    return () => {
      window.removeEventListener("scroll", handleStickyNavbar);
    };
  }, []);

  const navbarToggleHandler = () => {
    setNavbarOpen(!navbarOpen);
  };

  const closeNavbar = () => {
    setNavbarOpen(false);
  };

  const handleSubmenu = (index: number) => {
    setOpenIndex(openIndex === index ? -1 : index);
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const display_user_dashboard = () => {
    router.push("/user_dashboard");
  };

  return (
    <header
      className={`header left-0 top-0 z-40 flex w-full items-center bg-transparent ${
        sticky
          ? "!fixed !z-[9999] !bg-white !bg-opacity-80 shadow-sticky backdrop-blur-sm !transition dark:!bg-primary dark:!bg-opacity-20"
          : "absolute"
      }`}
    >
      <div className="container mt-5">
        <div className="relative -mx-4 flex items-center justify-between">
          {/* Logo */}
          <div className="max-w-full px-4 xl:mr-12">
            <Link
              href="/"
              className={`header-logo block w-full ${
                sticky ? "py-3 lg:py-1" : "py-0"
              }`}
            >
              <Image
                src={WBLdark}
                alt="logo"
                width={50}
                height={50}
                className="dark:hidden"
              />
              <Image
                src={WBLlight}
                alt="logo"
                width={50}
                height={50}
                className="hidden dark:block"
              />
            </Link>
          </div>

          <div className="flex w-full items-center justify-between px-4">
            {/* Mobile Navbar Toggle */}
            <div>
              <button
                onClick={navbarToggleHandler}
                id="navbarToggler"
                aria-label="Mobile Menu"
                className="absolute right-3 top-1/2 block -translate-y-1/2 rounded-lg px-2 py-1 focus:outline-none lg:hidden"
              >
                <span
                  className={`relative my-1.5 block h-0.5 w-[26px] bg-black transition-all duration-300 dark:bg-white ${
                    navbarOpen ? "top-[7px] rotate-45" : ""
                  }`}
                />
                <span
                  className={`relative my-1.5 block h-0.5 w-[26px] bg-black transition-all duration-300 dark:bg-white ${
                    navbarOpen ? "opacity-0" : ""
                  }`}
                />
                <span
                  className={`relative my-1.5 block h-0.5 w-[26px] bg-black transition-all duration-300 dark:bg-white ${
                    navbarOpen ? "top-[-8px] -rotate-45" : ""
                  }`}
                />
              </button>

              {/* Navbar Menu */}
              <nav
                id="navbarCollapse"
                className={`navbar absolute right-0 z-30 w-[250px] rounded bg-white px-6 py-4 duration-300 dark:bg-dark lg:visible lg:static lg:w-auto lg:bg-transparent lg:p-0 lg:opacity-100 ${
                  navbarOpen
                    ? "visible top-full opacity-100"
                    : "invisible top-[120%] opacity-0"
                }`}
              >
                <ul className="block lg:flex lg:space-x-12">
                  {menuData.map((menuItem, index) => (
                    <li key={menuItem.id} className="group relative">
                      {menuItem.path ? (
                        <Link
                          href={menuItem.path}
                          className="relative flex px-3 py-2 text-sm font-semibold text-dark duration-1000 before:absolute before:bottom-0 before:left-1/2 before:h-1 before:w-0 before:-translate-x-1/2 before:bg-primary before:transition-all before:duration-300 before:ease-out hover:before:w-full dark:text-white sm:text-base"
                          onClick={closeNavbar}
                        >
                          {menuItem.title}
                        </Link>
                      ) : (
                        <>
                          <div
                            onClick={() => handleSubmenu(index)}
                            className="group- flex cursor-pointer items-center justify-between px-3 py-2 text-sm font-semibold text-dark duration-500 hover:bg-gray-200 dark:text-white sm:text-base"
                          >
                            {menuItem.title}
                            <span className="pl-3">
                              <svg width="15" height="14" viewBox="0 0 15 14">
                                <path
                                  d="M7.81602 9.97495C7.68477 9.97495 7.57539 9.9312 7.46602 9.8437L2.43477 4.89995C2.23789 4.70308 2.23789 4.39683 2.43477 4.19995C2.63164 4.00308 2.93789 4.00308 3.13477 4.19995L7.81602 8.77183L12.4973 4.1562C12.6941 3.95933 13.0004 3.95933 13.1973 4.1562C13.3941 4.35308 13.3941 4.65933 13.1973 4.8562L8.16601 9.79995C8.05664 9.90933 7.94727 9.97495 7.81602 9.97495Z"
                                  fill="currentColor"
                                />
                              </svg>
                            </span>
                          </div>
                          <div
                            className={`submenu relative left-0 top-full rounded-md bg-white transition-all duration-300 dark:bg-dark lg:invisible lg:absolute lg:top-[110%] lg:block lg:w-[250px] lg:p-4 lg:opacity-0 lg:shadow-lg lg:group-hover:visible lg:group-hover:top-full ${
                              openIndex === index ? "block" : "hidden"
                            }`}
                          >
                            {menuItem.submenu.map((submenuItem) => (
                              <Link
                                href={submenuItem.path}
                                key={submenuItem.id}
                                className={`block rounded py-2.5 text-center text-sm font-semibold text-dark duration-500 hover:bg-gray-200 dark:text-white sm:text-base lg:px-5 ${
                                  submenuItem.title === "Resume"
                                    ? "hidden lg:block"
                                    : ""
                                }`}
                                onClick={closeNavbar}
                              >
                                {submenuItem.title}
                              </Link>
                            ))}
                          </div>
                        </>
                      )}
                    </li>
                  ))}

                  {/* Auth Buttons (Mobile) */}
                  {isAuthenticated && (
                    <li className="lg:hidden">
                      <button
                        onClick={() => {
                          closeNavbar();
                          display_user_dashboard();
                        }}
                        className="my-3 block w-full rounded-3xl bg-gradient-to-tl from-indigo-900 to-purple-400 px-3 py-2 text-center text-sm font-bold text-white sm:text-base"
                      >
                        My Profile
                      </button>
                    </li>
                  )}

                  {isAuthenticated ? (
                    <li className="lg:hidden">
                      <button
                        className="my-3 block w-full rounded-3xl bg-gradient-to-tl from-indigo-900 to-purple-400 px-3 py-2 text-center text-sm font-bold text-white sm:text-base"
                        onClick={() => {
                          closeNavbar();
                          handleLogout();
                        }}
                      >
                        Logout
                      </button>
                    </li>
                  ) : (
                    <>
                      <li className="lg:hidden">
                        <Link
                          href="/login"
                          className="my-3 block w-full rounded-3xl bg-gradient-to-tl from-indigo-900 to-purple-400 px-3 py-2 text-center text-sm font-bold text-white sm:text-base"
                          onClick={closeNavbar}
                        >
                          Login
                        </Link>
                      </li>
                      <li className="lg:hidden">
                        <Link
                          href="/signup"
                          className="block w-full rounded-3xl bg-gradient-to-tl from-indigo-900 to-purple-400 px-3 py-2 text-center text-sm font-bold text-white sm:text-base"
                          onClick={closeNavbar}
                        >
                          Register
                        </Link>
                      </li>
                    </>
                  )}
                </ul>
              </nav>
            </div>

            {/* Desktop Section */}
            <div className="hidden items-center justify-end pr-12 lg:flex lg:pr-0">
              {isAuthenticated ? (
                <div className="flex items-center gap-4">
                  {userRole === "admin" && (
                    <Link
                      href="/avatar"
                      className="whitespace-nowrap rounded-md bg-gradient-to-br from-indigo-900 to-purple-400 px-6 py-3 text-sm font-bold text-white transition duration-500 hover:bg-opacity-90 hover:bg-gradient-to-tl"
                    >
                      Avatar
                    </Link>
                  )}

                  <button
                    onClick={display_user_dashboard}
                    className="whitespace-nowrap rounded-md bg-gradient-to-br from-indigo-900 to-purple-400 px-6 py-3 text-sm font-bold text-white transition duration-500 hover:bg-opacity-90 hover:bg-gradient-to-tl"
                  >
                    My Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="whitespace-nowrap rounded-md bg-gradient-to-br from-indigo-900 to-purple-400 px-6 py-3 text-sm font-bold text-white transition duration-500 hover:bg-opacity-90 hover:bg-gradient-to-tl"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="mr-3 rounded-md bg-gradient-to-br from-indigo-900 to-purple-400 px-8 py-3 text-base font-bold text-white hover:bg-gradient-to-tl"
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    className="rounded-md bg-gradient-to-br from-indigo-900 to-purple-400 px-8 py-3 text-base font-bold text-white hover:bg-gradient-to-tl"
                  >
                    Register
                  </Link>
                </>
              )}
              <div className="pl-4">
                <ThemeToggler />
              </div>
            </div>

            {/* Mobile Right Section */}
            <div className="flex items-center gap-2 pr-10 lg:hidden">
              {isAuthenticated && userRole === "admin" && (
                <Link
                  href="/avatar"
                  className="whitespace-nowrap rounded-md bg-gradient-to-br from-indigo-900 to-purple-400 px-3 py-2 text-sm font-bold text-white"
                >
                  Avatar
                </Link>
              )}

              {isAuthenticated && (
                <>
                  <button
                    onClick={display_user_dashboard}
                    className="whitespace-nowrap rounded-md bg-gradient-to-br from-indigo-900 to-purple-400 px-3 py-2 text-sm font-bold text-white"
                  >
                    My Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="whitespace-nowrap rounded-md bg-gradient-to-br from-indigo-900 to-purple-400 px-3 py-2 text-sm font-bold text-white"
                  >
                    Logout
                  </button>
                </>
              )}
              <div className="ml-2">
                <ThemeToggler />
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
