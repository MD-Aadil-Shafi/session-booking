import { useMemo, useState, type ReactNode } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FiEye, FiEyeOff, FiCalendar, FiLock, FiMail, FiUser } from "react-icons/fi";
import { loginAction, registerAction } from "../redux/slices/authSlice";
import { useAppDispatch, useAppSelector } from "../redux/useTypedSelectors";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  role: z.string().min(1, "Select a role"),
  about: z.string().min(12, "Tell us a little more about yourself"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  timezone: z.string().min(2, "Select a timezone"),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

const getBrowserTimezone = () =>
  Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

const getAllTimezones = () => {
  const detected = getBrowserTimezone();
  const supported =
    typeof Intl.supportedValuesOf === "function"
      ? Intl.supportedValuesOf("timeZone")
      : [];
  const timezones = supported.length > 0 ? [...supported] : [detected, "UTC"];
  if (!timezones.includes(detected)) {
    timezones.unshift(detected);
  }
  return { detected, timezones };
};

const Auth = () => {
  const {user} = useAppSelector(state => state.auth);
  // console.log('loading', loading)
  if((user as any)?.email){
    return <Navigate to="/dashboard"/>
  }

  const location = useLocation();
  const navigate = useNavigate();
  const isRegister = location.pathname === "/register";

  const switchTab = (tab: "login" | "register") => {
    navigate(tab === "register" ? "/register" : "/login");
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 text-slate-900">
      <div className="pointer-events-none absolute -left-24 top-[-8rem] h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-[-6rem] h-[28rem] w-[28rem] rounded-full bg-indigo-500/15 blur-3xl" />

      <div className="relative mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-4 py-10 lg:grid-cols-2 lg:px-8">
        <section className="hidden lg:block">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-sm text-indigo-500">
            <FiCalendar />
            Session booking
          </div>
          <h1 className="mt-6 text-3xl font-semibold tracking-tight text-slate-900">
            Book Expert Professionals.
            <br />
            <span className="text-indigo-500">Notice positive changes.</span>
            
          </h1>
          <p className="mt-5 max-w-md text-lg leading-8 text-slate-600">
            Sign in to manage availability, reserve 1:1 sessions, and keep your session booking in one place.
          </p>
          <div className="mt-10 grid max-w-md grid-cols-2 gap-4">
            <Highlight title="Live slots" copy="See open times instantly." />
            <Highlight title="Secure auth" copy="Tokens stay on your device." />
          </div>
        </section>

        <section className="mx-auto w-full max-w-md">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-indigo-500/10 sm:p-8">
            <div className="mb-6 lg:hidden">
              <p className="text-sm uppercase tracking-[0.2em] text-indigo-500">Session booking</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">Welcome</h2>
            </div>

            <div className="relative mb-8 grid grid-cols-2 rounded-2xl bg-slate-100 p-1">
              <span
                className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-xl bg-indigo-500 shadow-lg shadow-indigo-500/30 transition-transform duration-300 ${
                  isRegister ? "translate-x-[calc(100%+4px)]" : "translate-x-1"
                }`}
              />
              <button
                type="button"
                onClick={() => switchTab("login")}
                className={`relative z-10 rounded-xl py-2.5 text-sm font-semibold transition-colors ${
                  isRegister ? "text-slate-500" : "text-white"
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => switchTab("register")}
                className={`relative z-10 rounded-xl py-2.5 text-sm font-semibold transition-colors ${
                  isRegister ? "text-white" : "text-slate-500"
                }`}
              >
                Register
              </button>
            </div>

            {isRegister ? (
              <RegisterForm onSwitch={() => switchTab("login")} />
            ) : (
              <LoginForm onSwitch={() => switchTab("register")} />
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

const Highlight = ({ title, copy }: { title: string; copy: string }) => (
  <div className="rounded-2xl border border-indigo-500/15 bg-white p-4 shadow-sm">
    <p className="font-medium text-slate-900">{title}</p>
    <p className="mt-1 text-sm text-slate-500">{copy}</p>
  </div>
);

const LoginForm = ({ onSwitch }: { onSwitch: () => void }) => {
  const dispatch = useAppDispatch();
  const loading = useAppSelector((state) => state.auth.loading);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (values: LoginFormValues) => {
    dispatch(loginAction(values));
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Field label="Email" error={errors.email?.message}>
        <div className="relative">
          <FiMail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            className="auth-input pl-10 pr-3"
            {...register("email")}
          />
        </div>
      </Field>

      <Field label="Password" error={errors.password?.message}>
        <div className="relative">
          <FiLock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Your password"
            className="auth-input px-10"
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <FiEyeOff /> : <FiEye />}
          </button>
        </div>
      </Field>

      <button type="submit" disabled={loading} className="auth-submit">
        {loading ? "Signing in..." : "Sign in"}
      </button>

      <p className="text-center text-sm text-slate-500">
        New here?{" "}
        <button type="button" onClick={onSwitch} className="font-medium text-indigo-500 hover:text-indigo-600">
          Create an account
        </button>
      </p>
    </form>
  );
};

const RegisterForm = ({ onSwitch }: { onSwitch: () => void }) => {
  const dispatch = useAppDispatch();
  const loading = useAppSelector((state) => state.auth.loading);
  const [showPassword, setShowPassword] = useState(false);
  const { detected, timezones } = useMemo(() => getAllTimezones(), []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      role: "MEMBER",
      about: "",
      email: "",
      password: "",
      timezone: detected,
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    const result = await dispatch(registerAction(values));
    if (registerAction.fulfilled.match(result)) {
      onSwitch();
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="First name" error={errors.firstName?.message}>
          <div className="relative">
            <FiUser className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="auth-input pl-10 pr-3" placeholder="Ada" {...register("firstName")} />
          </div>
        </Field>
        <Field label="Last name" error={errors.lastName?.message}>
          <input className="auth-input px-3" placeholder="Lovelace" {...register("lastName")} />
        </Field>
      </div>

      <Field label="Role" error={errors.role?.message}>
        <select className="auth-input px-3" {...register("role")}>
          <option value="MEMBER">MEMBER</option>
          <option value="PROFESSIONAL">PROFESSIONAL</option>
        </select>
      </Field>

      <Field label="About" error={errors.about?.message}>
        <textarea
          rows={3}
          className="auth-input min-h-[5.5rem] resize-none px-3 py-3"
          placeholder="What you want to learn or teach"
          {...register("about")}
        />
      </Field>

      <Field label="Email" error={errors.email?.message}>
        <div className="relative">
          <FiMail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="email"
            autoComplete="email"
            className="auth-input pl-10 pr-3"
            placeholder="you@example.com"
            {...register("email")}
          />
        </div>
      </Field>

      <Field label="Password" error={errors.password?.message}>
        <div className="relative">
          <FiLock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            className="auth-input px-10"
            placeholder="Create a password"
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <FiEyeOff /> : <FiEye />}
          </button>
        </div>
      </Field>

      <Field label="Timezone" error={errors.timezone?.message}>
        <select className="auth-input px-3" {...register("timezone")}>
          {timezones.map((zone) => (
            <option key={zone} value={zone}>
              {zone}
            </option>
          ))}
        </select>
      </Field>

      <button type="submit" disabled={loading} className="auth-submit">
        {loading ? "Creating account..." : "Create account"}
      </button>

      <p className="text-center text-sm text-slate-500">
        Already have an account?{" "}
        <button type="button" onClick={onSwitch} className="font-medium text-indigo-500 hover:text-indigo-600">
          Sign in
        </button>
      </p>
    </form>
  );
};

const Field = ({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) => (
  <label className="block">
    <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
    {children}
    {error ? <span className="mt-1 block text-xs text-rose-500">{error}</span> : null}
  </label>
);

export default Auth;
