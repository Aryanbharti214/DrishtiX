import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getDisasters,
  createDisaster as createDisasterRequest,
} from "../services/api";

const DisasterContext = createContext(null);

const STORAGE_KEY = "drishtix-current-disaster-id";

export function DisasterProvider({ children }) {
  const [disasters, setDisasters] = useState([]);
  const [currentDisaster, setCurrentDisaster] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState(null);

  /*
   * Fetch all disasters from backend
   */
  const refreshDisasters =
    useCallback(async () => {
      try {
        setLoading(true);
        setError(null);

        const response =
          await getDisasters();

        const disasterList =
          response?.data?.disasters ?? [];

        setDisasters(disasterList);

        setCurrentDisaster(
          (previousDisaster) => {
            /*
             * If current disaster still exists,
             * keep it selected.
             */
            if (previousDisaster) {
              const stillExists =
                disasterList.find(
                  (disaster) =>
                    disaster.id ===
                    previousDisaster.id
                );

              if (stillExists) {
                return stillExists;
              }
            }

            /*
             * Try restoring previous selection
             * from localStorage.
             */
            const storedId =
              localStorage.getItem(
                STORAGE_KEY
              );

            if (storedId) {
              const storedDisaster =
                disasterList.find(
                  (disaster) =>
                    disaster.id ===
                    storedId
                );

              if (storedDisaster) {
                return storedDisaster;
              }
            }

            /*
             * Otherwise select newest disaster.
             */
            return disasterList[0] ?? null;
          }
        );
      } catch (err) {
        console.error(
          "Failed to load disasters:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load disasters"
        );
      } finally {
        setLoading(false);
      }
    }, []);

  /*
   * Initial load
   */
  useEffect(() => {
    refreshDisasters();
  }, [refreshDisasters]);

  /*
   * Select currently active incident
   */
  function selectDisaster(disaster) {
    setCurrentDisaster(disaster);

    if (disaster?.id) {
      localStorage.setItem(
        STORAGE_KEY,
        disaster.id
      );
    } else {
      localStorage.removeItem(
        STORAGE_KEY
      );
    }
  }

  /*
   * Create new disaster
   */
  async function addDisaster(payload) {
    try {
      setError(null);

      const response =
        await createDisasterRequest(
          payload
        );

      const createdDisaster =
        response?.data?.disaster;

      if (!createdDisaster) {
        throw new Error(
          "Backend did not return created disaster"
        );
      }

      /*
       * Put newest disaster first.
       */
      setDisasters((previous) => [
        createdDisaster,
        ...previous,
      ]);

      /*
       * Automatically make it the
       * currently selected disaster.
       */
      selectDisaster(
        createdDisaster
      );

      return createdDisaster;
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to create disaster";

      setError(message);

      throw err;
    }
  }

  const value = useMemo(
    () => ({
      disasters,
      currentDisaster,
      loading,
      error,

      selectDisaster,
      addDisaster,
      refreshDisasters,
    }),
    [
      disasters,
      currentDisaster,
      loading,
      error,
      refreshDisasters,
    ]
  );

  return (
    <DisasterContext.Provider
      value={value}
    >
      {children}
    </DisasterContext.Provider>
  );
}

export function useDisaster() {
  const context =
    useContext(DisasterContext);

  if (!context) {
    throw new Error(
      "useDisaster must be used inside DisasterProvider"
    );
  }

  return context;
}