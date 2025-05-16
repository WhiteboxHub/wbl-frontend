import Breadcrumb from "./Breadcrumb";

const Layout = ({ children, currentPage }: any) => {
  return (
    <div className="max-w-6xl     px-4 sm:px-6 ">
      <header className="  flex items-center justify-between">
        <div>{/* Other header content */}</div>
        {/* Breadcrumb */}
        <div className="text-right ">
          <Breadcrumb currentPage={currentPage} />
        </div>
      </header>
      <main>{children}</main>
      {/* Footer and other components */}
    </div>
  );
};

export default Layout;
