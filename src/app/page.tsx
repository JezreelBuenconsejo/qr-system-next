"use client";
import React, { useState } from "react";
import { Scanner, IDetectedBarcode } from "@yudiel/react-qr-scanner";
import { Loader2 } from "lucide-react";

interface Log {
  name: string;
  employeeId: string;
  timeIn: string | null;
  timeOut: string | null;
}

export default function Home() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [status, setStatus] = useState<string>("");
  const [isReloading, setIsReloading] = useState<boolean>(false);

  const handleScan = async (barcodes: IDetectedBarcode[]) => {
    if (barcodes.length > 0) {
      let existingLogIndex;
      try {
        setIsReloading(true);
        setTimeout(() => setIsReloading(false), 1000);
  
        const parsedData = JSON.parse(barcodes[0].rawValue);
        const name = parsedData.Name || "Unknown";
        const employeeId = parsedData["Employee ID"] || "Unknown";
        const now = new Date().toISOString();
        setLogs((prevLogs) => {
          existingLogIndex = prevLogs.findIndex(
            (log) => log.employeeId === employeeId && log.timeOut === null
          );
  
          // Dynamically set the log action
          const isCheckOut = existingLogIndex >= 0;
  
          if (isCheckOut) {
            const updatedLogs = [...prevLogs];
            updatedLogs[existingLogIndex].timeOut = now;
            setStatus(
              `Employee ${name} (ID: ${employeeId}) checked out at ${new Date(now).toLocaleTimeString()}`
            );
            return updatedLogs;
          } else {
            const newLog: Log = { name, employeeId, timeIn: now, timeOut: null };
            setStatus(
              `Employee ${name} (ID: ${employeeId}) checked in at ${new Date(now).toLocaleTimeString()}`
            );
            return [...prevLogs, newLog];
          }
        });
  
        // Send to Google Sheets
        const response = await fetch("/api/logAttendance", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            employeeId,
            timeIn: !existingLogIndex ? null : now,
            timeOut: existingLogIndex ? now : null,
          }),
        });
  
        if (!response.ok) {
          const error = await response.json();
          console.error("Error logging to Google Sheets:", error.message);
          setStatus(`Failed to log attendance to Google Sheets: ${error.message}`);
        }
      } catch (error) {
        setStatus("Invalid QR code format. Please scan a valid JSON QR code.");
        console.error("QR Parsing Error:", error);
      }
    }
  };
  

  const handleError = (error: unknown) => {
    console.error("QR Reader Error: ", error);
    setStatus("Error scanning QR code. Please try again.");
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-xl sm:max-w-2xl lg:max-w-3xl p-4 sm:p-6 shadow-md bg-white rounded-lg">
        <h1 className="text-xl sm:text-2xl font-bold text-center mb-4 sm:mb-6">QR Code Attendance</h1>

        <div className="mb-6">
          <h2 className="text-base sm:text-lg font-semibold mb-2">Scan QR Code</h2>
          <div className="flex justify-center w-48 h-48 sm:w-64 sm:h-64 mx-auto">
            {isReloading ? (
              <div className="flex flex-col justify-center items-center w-full h-full border">
                <p className="text-sm sm:text-base">Reloading</p>
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : (
              <Scanner
                onScan={(barcodes) => handleScan(barcodes)}
                onError={(error) => handleError(error)}
                allowMultiple
              />
            )}
          </div>
          <p className="text-center text-sm sm:text-base text-gray-600 mt-4">{status}</p>
        </div>

        <div className="text-sm sm:text-lg font-semibold mb-4">Attendance Logs</div>
        <div className="overflow-x-auto">
          <table className="table-auto w-full">
            <thead className="bg-gray-200">
              <tr>
                <th className="px-2 sm:px-4 py-2 text-sm sm:text-base">Name</th>
                <th className="px-2 sm:px-4 py-2 text-sm sm:text-base">Employee ID</th>
                <th className="px-2 sm:px-4 py-2 text-sm sm:text-base">Time In</th>
                <th className="px-2 sm:px-4 py-2 text-sm sm:text-base">Time Out</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, index) => (
                <tr key={index} className="odd:bg-white even:bg-gray-50">
                  <td className="px-2 sm:px-4 py-2 text-sm sm:text-base">{log.name}</td>
                  <td className="px-2 sm:px-4 py-2 text-sm sm:text-base">{log.employeeId}</td>
                  <td className="px-2 sm:px-4 py-2 text-sm sm:text-base">
                    {log.timeIn ? new Date(log.timeIn).toLocaleString() : "-"}
                  </td>
                  <td className="px-2 sm:px-4 py-2 text-sm sm:text-base">
                    {log.timeOut ? new Date(log.timeOut).toLocaleString() : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
