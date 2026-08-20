import React, {
  useEffect,
  useState,
} from "react";

import Sidebar
  from "./components/Sidebar";

import Header
  from "./components/Header";

import Dashboard
  from "./pages/Dashboard";

import Disasters
  from "./pages/Disasters";

import DisasterMap
  from "./pages/DisasterMap";

import Priorities
  from "./pages/Priorities";

import Verification
  from "./pages/Verification";

import Findings
  from "./pages/Findings";

import Evidence
  from "./pages/Evidence";

import Imagery
  from "./pages/Imagery";

import Settings
  from "./pages/Settings";

import Login
  from "./pages/Login";


import {
  SettingsProvider,
  useSettings,
} from "./context/SettingsContext";


import {
  DisasterProvider,
  useDisaster,
} from "./context/DisasterContext";


import {
  clearAuthToken,
  getAuthSession,
  getAuthToken,
  getHealth,
} from "./services/api";


function AppContent() {

  const [
    isAuthenticated,
    setIsAuthenticated,
  ] = useState(false);


  const [
    authReady,
    setAuthReady,
  ] = useState(false);


  const [
    activeTab,
    setActiveTab,
  ] = useState(
    "dashboard"
  );


  const {
    isDarkMode,
  } =
    useSettings();


  const {
    currentDisaster,
    refreshDisasters,
  } =
    useDisaster();


  /*
  |--------------------------------------------------------------------------
  | Restore authentication session
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {

      let mounted =
        true;


      async function restoreSession() {

        const token =
          getAuthToken();


        if (
          !token
        ) {

          if (
            mounted
          ) {

            setIsAuthenticated(
              false
            );


            setAuthReady(
              true
            );

          }


          return;
        }


        try {

          await getAuthSession();


          if (
            mounted
          ) {

            setIsAuthenticated(
              true
            );
            await refreshDisasters();
          }

        } catch {

          clearAuthToken();


          if (
            mounted
          ) {

            setIsAuthenticated(
              false
            );

          }

        } finally {

          if (
            mounted
          ) {

            setAuthReady(
              true
            );

          }

        }

      }


      void restoreSession();


      function handleUnauthorized() {

        clearAuthToken();


        setIsAuthenticated(
          false
        );


        setActiveTab(
          "dashboard"
        );

      }


      window.addEventListener(
        "drishtix:unauthorized",
        handleUnauthorized
      );


      return () => {

        mounted =
          false;


        window.removeEventListener(
          "drishtix:unauthorized",
          handleUnauthorized
        );

      };

   }, [
  refreshDisasters,
]);


  /*
  |--------------------------------------------------------------------------
  | System health
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {

      async function checkSystemHealth() {

        try {

          const result =
            await getHealth();


          console.log(
            "DrishtiX system health:",
            result
          );

        } catch (error) {

          console.error(
            "DrishtiX health check failed:",
            error
          );

        }

      }


      void checkSystemHealth();

    },
    []
  );


  /*
  |--------------------------------------------------------------------------
  | Theme
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {

      const root =
        document.documentElement;


      if (
        isDarkMode
      ) {

        root.classList.add(
          "dark"
        );


        root.classList.remove(
          "light"
        );

      } else {

        root.classList.add(
          "light"
        );


        root.classList.remove(
          "dark"
        );

      }

    },
    [
      isDarkMode,
    ]
  );


  /*
  |--------------------------------------------------------------------------
  | Login / Logout
  |--------------------------------------------------------------------------
  */

 async function handleLogin() {

  setIsAuthenticated(
    true
  );


  setActiveTab(
    "dashboard"
  );
  await refreshDisasters();

}


  function handleSignOut() {

    clearAuthToken();


    setIsAuthenticated(
      false
    );


    setActiveTab(
      "dashboard"
    );

  }


  /*
  |--------------------------------------------------------------------------
  | Initial auth loading state
  |--------------------------------------------------------------------------
  */

  if (
    !authReady
  ) {

    return (
      <div
        className="
          min-h-screen
          bg-slate-950
          flex
          items-center
          justify-center
          text-slate-400
        "
      >

        <div className="text-center">

          <div
            className="
              w-8
              h-8
              border-2
              border-slate-700
              border-t-orange-500
              rounded-full
              animate-spin
              mx-auto
            "
          />


          <p
            className="
              mt-4
              text-xs
              uppercase
              tracking-widest
            "
          >
            Restoring secure session
          </p>

        </div>

      </div>
    );

  }


  /*
  |--------------------------------------------------------------------------
  | Login screen
  |--------------------------------------------------------------------------
  */

  if (
    !isAuthenticated
  ) {

    return (
      <Login
        onLogin={
          handleLogin
        }
      />
    );

  }


  /*
  |--------------------------------------------------------------------------
  | Authenticated application
  |--------------------------------------------------------------------------
  */

  return (
    <div
      className="
        flex
        min-h-screen
        bg-[var(--bg-main)]
        font-sans
        transition-colors
      "
    >

      <Sidebar
        activeTab={
          activeTab
        }
        setActiveTab={
          setActiveTab
        }
        currentDisaster={
          currentDisaster
        }
      />


      <div className="flex-1 flex flex-col min-w-0">

        <Header
          eventName={
            currentDisaster?.name ??
            "No Disaster Selected"
          }
          onNavigate={
            setActiveTab
          }
          onSignOut={
            handleSignOut
          }
        />


        <main
          className="
            p-4
            sm:p-6
            lg:p-8
            flex-1
            overflow-y-auto
          "
        >

          {
            activeTab ===
              "dashboard" &&
            (
              <Dashboard
                setActiveTab={
                  setActiveTab
                }
              />
            )
          }


          {
            activeTab ===
              "disasters" &&
            (
              <Disasters />
            )
          }


          {
            activeTab ===
              "map" &&
            (
              <DisasterMap />
            )
          }


          {
            activeTab ===
              "priorities" &&
            (
              <Priorities
                setActiveTab={
                  setActiveTab
                }
              />
            )
          }


          {
            activeTab ===
              "verify" &&
            (
              <Verification />
            )
          }


          {
            activeTab ===
              "findings" &&
            (
              <Findings />
            )
          }


          {
            activeTab ===
              "evidence" &&
            (
              <Evidence />
            )
          }


          {
            activeTab ===
              "imagery" &&
            (
              <Imagery />
            )
          }


          {
            activeTab ===
              "settings" &&
            (
              <Settings
                onSignOut={
                  handleSignOut
                }
              />
            )
          }

        </main>

      </div>

    </div>
  );
}


export default function App() {

  return (
    <SettingsProvider>

      <DisasterProvider>

        <AppContent />

      </DisasterProvider>

    </SettingsProvider>
  );
}