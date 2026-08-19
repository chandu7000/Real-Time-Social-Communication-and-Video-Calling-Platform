import { useState } from "react";
import { ShipWheelIcon } from "lucide-react";
import { Link } from "react-router";
import useLogin from "../hooks/useLogin";
import { getApiErrorMessage } from "../lib/profile";

const LoginPage = () => {
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const { isPending, error, loginMutation } = useLogin();

  const handleLogin = (e) => {
    e.preventDefault();
    loginMutation(loginData);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-base-200/60 p-4 sm:p-6 md:p-8"
    >
      <div className="border border-base-300 flex flex-col lg:flex-row w-full max-w-5xl mx-auto bg-base-100 rounded-2xl shadow-xl overflow-hidden">
        {/* LOGIN FORM SECTION */}
        <div className="w-full lg:w-1/2 p-4 sm:p-8 flex flex-col">
          {/* LOGO */}
          <div className="mb-4 flex items-center justify-start gap-2">
            <ShipWheelIcon className="size-9 text-primary" />
            <span className="text-3xl font-bold tracking-tight">
              Zenvio
            </span>
          </div>

          {/* ERROR MESSAGE DISPLAY */}
          {error && (
            <div className="alert alert-error mb-4">
              <span>{getApiErrorMessage(error, "Unable to sign in")}</span>
            </div>
          )}

          <div className="w-full">
            <form onSubmit={handleLogin}>
              <div className="space-y-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
                  <p className="text-sm opacity-70">
                    Sign in to continue your conversations and connections
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="form-control w-full space-y-2">
                    <label className="label" htmlFor="login-email">
                      <span className="label-text font-medium">Email</span>
                    </label>
                    <input
                      id="login-email"
                      name="email"
                      autoComplete="email"
                      type="email"
                      placeholder="hello@example.com"
                      className="input input-bordered w-full"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-control w-full space-y-2">
                    <label className="label" htmlFor="login-password">
                      <span className="label-text font-medium">Password</span>
                    </label>
                    <input
                      id="login-password"
                      name="password"
                      autoComplete="current-password"
                      type="password"
                      placeholder="••••••••"
                      className="input input-bordered w-full"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      required
                    />
                  </div>

                  <button type="submit" className="btn btn-primary w-full" disabled={isPending}>
                    {isPending ? (
                      <>
                        <span className="loading loading-spinner loading-xs"></span>
                        Signing in...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </button>

                  <div className="text-center mt-4">
                    <p className="text-sm">
                      Don't have an account?{" "}
                      <Link to="/signup" className="text-primary hover:underline">
                        Create one
                      </Link>
                    </p>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* IMAGE SECTION */}
        <div className="hidden lg:flex w-full lg:w-1/2 bg-primary/10 items-center justify-center">
          <div className="max-w-md p-8">
            {/* Illustration */}
            <div className="relative aspect-square max-w-sm mx-auto">
              <img src="/i.png" alt="People connecting through Zenvio" className="w-full h-full" />
            </div>

            <div className="text-center space-y-3 mt-6">
              <h2 className="text-xl font-semibold">Stay connected with the people who matter</h2>
              <p className="opacity-70">
                Build connections, message in real time, and move naturally from chat to private video calls.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default LoginPage;
