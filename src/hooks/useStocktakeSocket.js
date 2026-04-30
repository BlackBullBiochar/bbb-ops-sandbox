import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { API } from "../config/api";

/**
 * Connects to the Socket.io server, joins the session room,
 * and fires onEvent(eventName, data) for every stocktake event.
 *
 * Cleans up (leaves room + disconnects) on unmount.
 */
export function useStocktakeSocket(session_code, name, onEvent) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!session_code) return;

    const socket = io(API, {
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      socket.emit("join_session", { session_code, name });
    });

    const events = [
      "bag_scanned",
      "bag_updated",
      "bag_removed",
      "session_ended",
      "session_ending",
      "session_end_cancelled",
      "member_joined",
      "member_left",
      "member_removed",
      "member_removal_requested",
      "member_removal_cancelled",
    ];

    events.forEach((evt) => {
      socket.on(evt, (data) => onEventRef.current(evt, data));
    });

    return () => {
      socket.emit("leave_session", { session_code });
      socket.disconnect();
    };
  }, [session_code]);
}
