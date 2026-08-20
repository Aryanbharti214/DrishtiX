import React, {
  useState,
} from "react";

import {
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  LockKeyhole,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import {
  login,
} from "../services/api";


export default function Login({
  onLogin,
}) {

  const [
    credentials,
    setCredentials,
  ] = useState({
    agencyId:
      "",

    password:
      "",
  });


  const [
    loading,
    setLoading,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState("");


  const [
    showPassword,
    setShowPassword,
  ] = useState(false);


  function handleChange(
    event
  ) {

    const {
      name,
      value,
    } =
      event.target;


    setCredentials(
      (
        previous
      ) => ({
        ...previous,

        [name]:
          value,
      })
    );


    if (
      error
    ) {

      setError(
        ""
      );

    }

  }


  async function handleSubmit(
    event
  ) {

    event.preventDefault();


    if (
      !credentials
        .agencyId
        .trim()
    ) {

      setError(
        "Officer ID is required."
      );

      return;

    }


    if (
      !credentials.password
    ) {

      setError(
        "Access key is required."
      );

      return;

    }


    try {

      setLoading(
        true
      );


      setError(
        ""
      );


      await login({
        agencyId:
          credentials
            .agencyId
            .trim(),

        password:
          credentials
            .password,
      });


      onLogin();

    } catch (err) {

      setError(
        err instanceof Error
          ? err.message
          : "Authentication failed"
      );

    } finally {

      setLoading(
        false
      );

    }

  }


  return (
    <div
      className="
        min-h-screen
        bg-gradient-to-br
        from-slate-950
        via-slate-950
        to-blue-950
        flex
        items-center
        justify-center
        px-4
        py-8
        relative
        overflow-hidden
      "
    >

      {/* BACKGROUND */}

      <div
        className="
          absolute
          -top-40
          -left-40
          w-[500px]
          h-[500px]
          rounded-full
          bg-blue-600/10
          blur-3xl
          pointer-events-none
        "
      />


      <div
        className="
          absolute
          -bottom-40
          -right-40
          w-[500px]
          h-[500px]
          rounded-full
          bg-orange-600/10
          blur-3xl
          pointer-events-none
        "
      />


      <div
        className="
          w-full
          max-w-[440px]
          rounded-2xl
          border
          border-slate-700/70
          bg-slate-950/95
          shadow-[0_30px_100px_rgba(0,0,0,0.65)]
          backdrop-blur-xl
          overflow-hidden
          relative
          z-10
        "
      >

        {/* TOP ACCENT */}

        <div className="h-1 flex">

          <div className="flex-1 bg-blue-600" />

          <div className="flex-1 bg-orange-500" />

          <div className="flex-1 bg-cyan-500" />

        </div>


        <div className="p-7 sm:p-8">


          {/* BRAND */}

          <div className="text-center">

            <div
              className="
                w-14
                h-14
                mx-auto
                rounded-2xl
                bg-orange-500/10
                border
                border-orange-500/30
                flex
                items-center
                justify-center
              "
            >

              <ShieldCheck
                className="
                  w-7
                  h-7
                  text-orange-500
                "
              />

            </div>


            <h1
              className="
                mt-5
                text-3xl
                font-black
                tracking-[0.18em]
                text-white
              "
            >
              DRISHTIX
            </h1>


            <p
              className="
                mt-2
                text-sm
                font-semibold
                text-slate-200
              "
            >
              Disaster Intelligence Command
            </p>


            <p
              className="
                mt-1
                text-xs
                text-slate-500
              "
            >
              Human-in-the-loop operational decision support
            </p>

          </div>


          {/* ACCESS BADGE */}

          <div className="flex justify-center mt-5">

            <div
              className="
                inline-flex
                items-center
                gap-2
                rounded-full
                border
                border-orange-500/25
                bg-orange-500/10
                px-3
                py-1.5
                text-[10px]
                font-bold
                uppercase
                tracking-widest
                text-orange-300
              "
            >

              <LockKeyhole className="w-3 h-3" />

              Authorized Access

            </div>

          </div>


          {/* FORM */}

          <form
            onSubmit={
              handleSubmit
            }
            className="mt-8 space-y-5"
          >


            {/* AGENCY ID */}

            <div>

              <label
                htmlFor="agencyId"
                className="
                  block
                  text-[11px]
                  font-bold
                  uppercase
                  tracking-wider
                  text-slate-400
                  mb-2
                "
              >
                Officer / Agency ID
              </label>


              <div className="relative">

                <UserRound
                  className="
                    absolute
                    left-3.5
                    top-1/2
                    -translate-y-1/2
                    w-4
                    h-4
                    text-slate-500
                  "
                />


                <input
                  id="agencyId"
                  name="agencyId"
                  type="text"
                  autoComplete="username"
                  disabled={
                    loading
                  }
                  value={
                    credentials.agencyId
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Enter officer ID"
                  className="
                    w-full
                    rounded-xl
                    border
                    border-slate-700
                    bg-slate-900
                    py-3
                    pl-10
                    pr-4
                    text-sm
                    text-slate-100
                    placeholder:text-slate-600
                    outline-none
                    transition
                    focus:border-orange-500
                    focus:ring-2
                    focus:ring-orange-500/15
                    disabled:opacity-60
                  "
                />

              </div>

            </div>


            {/* PASSWORD */}

            <div>

              <label
                htmlFor="password"
                className="
                  block
                  text-[11px]
                  font-bold
                  uppercase
                  tracking-wider
                  text-slate-400
                  mb-2
                "
              >
                Access Key
              </label>


              <div className="relative">

                <KeyRound
                  className="
                    absolute
                    left-3.5
                    top-1/2
                    -translate-y-1/2
                    w-4
                    h-4
                    text-slate-500
                  "
                />


                <input
                  id="password"
                  name="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  autoComplete="current-password"
                  disabled={
                    loading
                  }
                  value={
                    credentials.password
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Enter access key"
                  className="
                    w-full
                    rounded-xl
                    border
                    border-slate-700
                    bg-slate-900
                    py-3
                    pl-10
                    pr-11
                    text-sm
                    text-slate-100
                    placeholder:text-slate-600
                    outline-none
                    transition
                    focus:border-orange-500
                    focus:ring-2
                    focus:ring-orange-500/15
                    disabled:opacity-60
                  "
                />


                <button
                  type="button"
                  disabled={
                    loading
                  }
                  onClick={
                    () =>
                      setShowPassword(
                        (
                          previous
                        ) =>
                          !previous
                      )
                  }
                  className="
                    absolute
                    right-3
                    top-1/2
                    -translate-y-1/2
                    p-1
                    rounded
                    text-slate-500
                    hover:text-slate-300
                  "
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >

                  {
                    showPassword
                      ? (
                        <EyeOff className="w-4 h-4" />
                      )
                      : (
                        <Eye className="w-4 h-4" />
                      )
                  }

                </button>

              </div>

            </div>


            {/* ERROR */}

            {
              error &&
              (
                <div
                  className="
                    rounded-xl
                    border
                    border-red-500/30
                    bg-red-500/10
                    px-3.5
                    py-3
                    text-xs
                    leading-relaxed
                    text-red-300
                  "
                >
                  {error}
                </div>
              )
            }


            {/* SECURITY INFO */}

            <div
              className="
                rounded-xl
                border
                border-slate-800
                bg-slate-900/60
                px-4
                py-3
              "
            >

              <div className="flex gap-3">

                <LockKeyhole
                  className="
                    w-4
                    h-4
                    text-cyan-400
                    mt-0.5
                    shrink-0
                  "
                />


                <p
                  className="
                    text-[11px]
                    leading-relaxed
                    text-slate-400
                  "
                >
                  Access is validated by the DrishtiX backend.
                  Evidence, fusion, and priority outputs remain
                  subject to human review.
                </p>

              </div>

            </div>


            {/* SUBMIT */}

            <button
              type="submit"
              disabled={
                loading
              }
              className="
                w-full
                rounded-xl
                bg-orange-600
                hover:bg-orange-500
                disabled:bg-orange-700
                disabled:opacity-60
                py-3
                px-4
                text-sm
                font-extrabold
                text-white
                transition
                shadow-lg
                shadow-orange-950/30
                flex
                items-center
                justify-center
                gap-2
              "
            >

              {
                loading
                  ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />

                      Authenticating...
                    </>
                  )
                  : (
                    <>
                      <ShieldCheck className="w-4 h-4" />

                      Authenticate Session
                    </>
                  )
              }

            </button>

          </form>


          {/* FOOTER */}

          <div
            className="
              mt-7
              pt-5
              border-t
              border-slate-800
              text-center
            "
          >

            <p
              className="
                text-[10px]
                uppercase
                tracking-widest
                text-slate-600
              "
            >
              DrishtiX Operational Access Layer
            </p>

          </div>

        </div>

      </div>

    </div>
  );
}