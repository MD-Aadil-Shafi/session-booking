import React, { useEffect, useState } from "react";
import { FiChevronsRight, FiHome, FiMonitor, FiLogOut, FiCalendar, FiBell } from "react-icons/fi";
import { motion } from "motion/react";
import type { IconType } from "react-icons";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../redux/useTypedSelectors";
import SpringModal from "./SpringModal";
import { logout } from "../redux/slices/authSlice";
import { unreadCountAction } from "../redux/slices/notificationSlice";
import { FaHeart } from "react-icons/fa6";

export const SidebarContainer = ({children}:{children:React.ReactNode}) => {
  return (
    <div className="flex bg-indigo-50">
      <Sidebar />
      {children}
    </div>
  );
};

type ToggleCloseType = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

type OptionType = {
  Icon: IconType;
  title: string;
  selected: string;
  setSelected: React.Dispatch<React.SetStateAction<string>>;
  open: boolean;
  notifs?: number;
  isDisabled?: boolean;
};

const Sidebar = () => {
  const dispatch = useAppDispatch();
  const { unreadCount } = useAppSelector((state) => state.notifications);

  const [confirm, setIsConfirm] = useState(false);
  const location = useLocation();
  const [open, setOpen] = useState(true);
  const [selected, setSelected] = useState("Dashboard");

  useEffect(() => {
    if (location?.pathname === "/dashboard") return setSelected("Dashboard");
    if (location?.pathname === "/professionals") return setSelected("Professionals");
    if (location?.pathname === "/sessions") return setSelected("Sessions");
    if (location?.pathname === "/notifications") return setSelected("Notifications");
  }, [location?.pathname]);

  // Poll unread count on mount
  useEffect(() => {
    dispatch(unreadCountAction());
  }, [dispatch]);

  return (
    <motion.nav
      layout
      className="sticky top-0 h-screen shrink-0 border-r border-slate-300 bg-white p-2 inset-0 z-50"
      style={{ width: open ? "225px" : "fit-content" }}
    >
      <TitleSection open={open} />

      <div className="space-y-1">
        <Option
          Icon={FiHome}
          title="Dashboard"
          selected={selected}
          setSelected={setSelected}
          open={open}
        />
        <Option
          Icon={FiMonitor}
          title="Professionals"
          selected={selected}
          setSelected={setSelected}
          open={open}
        />
        <Option
          Icon={FiCalendar}
          title="Sessions"
          selected={selected}
          setSelected={setSelected}
          open={open}
        />
        <Option
          Icon={FiBell}
          title="Notifications"
          selected={selected}
          setSelected={setSelected}
          open={open}
          notifs={unreadCount > 0 ? unreadCount : undefined}
        />
      </div>

      <div
        onClick={() => setIsConfirm(true)}
        className="absolute bottom-20 left-0 flex gap-1 items-center justify-center hover:bg-rose-100 w-full p-2 cursor-pointer rounded"
      >
        <FiLogOut />
        {open && (
          <p className="text-center text-rose-600 text-sm font-light">Logout</p>
        )}
      </div>

      <ToggleClose open={open} setOpen={setOpen} />
      <SpringModal
        isOpen={confirm}
        setIsOpen={setIsConfirm}
        title="Logging Out?"
        message="Are you sure you want to logout?"
        action={() => dispatch(logout())}
      />
    </motion.nav>
  );
};

const Option = ({ Icon, title, selected, open, notifs, isDisabled = false }: OptionType) => {
  const navigate = useNavigate();

  return (
    <motion.button
      disabled={isDisabled}
      layout
      onClick={() => navigate(`/${title.toLowerCase()}`)}
      className={`relative flex h-10 w-full items-center rounded-md transition-colors
        ${selected === title ? "bg-indigo-100 text-indigo-800" : "text-slate-500 hover:bg-slate-100"}
        ${isDisabled ? "cursor-not-allowed" : ""}`}
    >
      <motion.div layout className="grid h-full w-10 place-content-center text-lg">
        <Icon />
      </motion.div>

      {open && (
        <motion.span
          layout
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.125 }}
          className="text-xs font-medium"
        >
          {title}
        </motion.span>
      )}

      {notifs && (
        <motion.span
          initial={{ scale: 0, opacity: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ y: "-50%" }}
          transition={{ delay: 0.3 }}
          className={`absolute top-1/2 size-4 rounded bg-indigo-500 text-[10px] leading-4 text-center text-white font-semibold
            ${open ? "right-2" : "right-0.5"}`}
        >
          {notifs > 9 ? "9+" : notifs}
        </motion.span>
      )}
    </motion.button>
  );
};

const TitleSection = ({ open }: { open: boolean }) => {
  return (
    <div className="mb-3 border-b border-slate-300 pb-3">
      <Link
        to="/"
        className="flex cursor-pointer items-center justify-between rounded-md transition-colors hover:bg-slate-100"
      >
        <div className="flex items-center gap-2">
          <FaHeart className="text-indigo-500" size={32} />
          {open && (
            <motion.div
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.125 }}
            >
              <span className="block text-xs font-semibold text-indigo-500">My Minds</span>
              <span className="block text-xs text-slate-500">Your Health Buddy</span>
            </motion.div>
          )}
        </div>
      </Link>
    </div>
  );
};

const ToggleClose = ({ open, setOpen }: ToggleCloseType) => {
  return (
    <motion.button
      layout
      onClick={() => setOpen((pv) => !pv)}
      className="absolute bottom-0 left-0 right-0 border-t border-slate-300 transition-colors hover:bg-slate-100"
    >
      <div className="flex items-center p-2">
        <motion.div layout className="grid size-10 place-content-center text-lg">
          <FiChevronsRight className={`transition-transform ${open && "rotate-180"}`} />
        </motion.div>
        {open && (
          <motion.span
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.125 }}
            className="text-xs font-medium"
          >
            Hide
          </motion.span>
        )}
      </div>
    </motion.button>
  );
};
