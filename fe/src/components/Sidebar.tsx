import React, { useEffect, useState } from "react";
import {
  FiChevronsRight,
  FiHome,
  FiMonitor,
  FiUser,
  FiMessageSquare,
  FiLogOut,
} from "react-icons/fi";
import { motion } from "motion/react";
import type { IconType } from "react-icons";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../redux/useTypedSelectors";
import SpringModal from "./SpringModal";
import { logout } from "../redux/slices/authSlice";
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
    setOpen: React.Dispatch<React.SetStateAction<boolean>>
}

type OptionType = {
    Icon:IconType;
    title:string;
    selected: string;
    setSelected: React.Dispatch<React.SetStateAction<string>>;
    open: boolean;
    notifs?: number; 
    isDisabled?:boolean;
}

const Sidebar = () => {
  const dispatch = useAppDispatch()
//   const {metrics} = useAppSelector(state => state.docs)

  const [confirm, setIsConfirm] = useState(false)
  const location = useLocation()
  const [open, setOpen] = useState(true);
  const [selected, setSelected] = useState("Dashboard");

  useEffect(()=>{
        if(location?.pathname == "/dashboard") return setSelected("Dashboard")
        if(location?.pathname == "/professionals") return setSelected("Professionals")
        if(location?.pathname == "/profile") return setSelected("Profile")
        if(location?.pathname?.includes("/chat/")) return setSelected("Chat")
    },[location?.pathname])

  return (
    <motion.nav
      layout
      className="sticky top-0 h-screen shrink-0 border-r border-slate-300 bg-white p-2
      inset-0 z-50
      "
      style={{
        width: open ? "225px" : "fit-content",
      }}
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
          notifs={5}
        />
        <Option
          Icon={FiUser}
          title="Profile"
          selected={selected}
          setSelected={setSelected}
          open={open}
        />
        <Option
          Icon={FiMessageSquare}
          title="Chat"
          selected={selected}
          setSelected={setSelected}
          open={open}
          isDisabled={true}
        />
      </div>
      <div 
      onClick={()=>setIsConfirm(true)}
      className="absolute bottom-20 left-0 flex gap-1 items-center justify-center hover:bg-rose-100 w-full p-2 cursor-pointer rounded">
        <FiLogOut/>
        {open &&
        <p className="text-center text-rose-600 text-sm font-light">Logout</p>
        }
        </div>

      <ToggleClose open={open} setOpen={setOpen} />
      <SpringModal isOpen={confirm} setIsOpen={setIsConfirm} title="Logging Out?"
        message="Are you sure you want to logout?"
        action={()=>dispatch(logout())}
      />
    </motion.nav>
  );
};

const Option = ({ Icon, title, selected, open, notifs, isDisabled = false }:OptionType) => {
    const navigate = useNavigate()

    const handleNavigation = (val: string) =>{
        navigate(val)
    }
  return (
    <motion.button
    disabled={isDisabled}
      layout
    //   onClick={() => setSelected(title)}
      onClick={() => handleNavigation(`/${title?.toLocaleLowerCase()}`)}
      className={`relative flex h-10 w-full items-center rounded-md transition-colors 
        ${selected === title ? "bg-indigo-100 text-indigo-800" : "text-slate-500 hover:bg-slate-100"}
        ${isDisabled && "cursor-not-allowed"}
        `}
    >
      <motion.div
        layout
        className="grid h-full w-10 place-content-center text-lg"
      >
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
          {title} {title === "Chat" ? <span className="text-[8px]">(select a document from list.)</span> : null}
        </motion.span>
      )}

      {notifs && open && (
        <motion.span
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            opacity: 1,
            scale: 1,
          }}
          style={{ y: "-50%" }}
          transition={{ delay: 0.5 }}
          className="absolute right-2 top-1/2 size-4 rounded bg-indigo-500 text-xs text-white"
        >
          {notifs}
        </motion.span>
      )}
    </motion.button>
  );
};

const TitleSection = ({ open }:{open: boolean}) => {
  return (
    <div className="mb-3 border-b border-slate-300 pb-3">
      <Link to="/" className="flex cursor-pointer items-center justify-between rounded-md transition-colors hover:bg-slate-100">
        <div className="flex items-center gap-2">
          {/* <Logo /> */}
         <FaHeart className="text-indigo-500" size={32}/>
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
        {/* {open && <FiChevronDown className="mr-2" />} */}
      </Link>
    </div>
  );
};


const ToggleClose = ({ open, setOpen }:ToggleCloseType) => {
  return (
    <motion.button
      layout
      onClick={() => setOpen((pv) => !pv)}
      className="absolute bottom-0 left-0 right-0 border-t border-slate-300 transition-colors hover:bg-slate-100"
    >
      <div className="flex items-center p-2">
        <motion.div
          layout
          className="grid size-10 place-content-center text-lg"
        >
          <FiChevronsRight
            className={`transition-transform ${open && "rotate-180"}`}
          />
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
