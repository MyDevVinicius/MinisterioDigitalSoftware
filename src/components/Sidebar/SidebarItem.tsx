import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SidebarDropdown from "./SidebarDropdown";
SidebarDropdown;

const SidebarItem = ({ item, setPageName }: any) => {
  const pathname = usePathname();

  const handleClick = () => {
    setPageName(item.label.toLowerCase());
  };

  const isActive = (item: any) => {
    return pathname === item.route;
  };

  return (
    <li>
      <Link
        href={item.route}
        onClick={handleClick}
        className={`group relative flex items-center gap-2.5 rounded-md px-4 py-2 text-sm font-medium text-bodydark2 duration-300 ease-in-out hover:text-white ${
          isActive(item) ? "text-white" : ""
        }`}
      >
        {item.icon}
        {item.label}
      </Link>
      {item.children && isActive(item) && (
        <SidebarDropdown item={item.children} />
      )}
    </li>
  );
};

export default SidebarItem;
