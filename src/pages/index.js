import { useState, useEffect } from "react";
import {
  AcademicCapIcon,
  UserGroupIcon,
  ClipboardDocumentCheckIcon,
} from "@heroicons/react/24/outline";

export default function Home() {
  const [workType, setWorkType] = useState("");
  const [minutes, setMinutes] = useState("");
  const [entries, setEntries] = useState([]);
  const [date, setDate] = useState("");
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [archive, setArchive] = useState([]);
  const [flatRate, setFlatRate] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [editingId, setEditingId] = useState(null);

  const fixedPayRate = 18; // fixed pay rate here

  // --- Helper: build a summary object from an entries array
  const createSummaryFromEntries = (entriesArr) => {
    const totalEntries = entriesArr.length;
    const totalMinutes = entriesArr.reduce(
      (sum, e) => sum + (typeof e.minutes === "number" ? e.minutes : 0),
      0
    );
    const totalPay = entriesArr.reduce(
      (sum, e) => sum + (parseFloat(e.total) || 0),
      0
    );
    const byType = entriesArr.reduce((acc, e) => {
      const type = e.workType || "Other";
      if (!acc[type]) acc[type] = { minutes: 0, total: 0 };
      if (typeof e.minutes === "number") acc[type].minutes += e.minutes;
      acc[type].total += parseFloat(e.total) || 0;
      return acc;
    }, {});
    return {
      totalEntries,
      totalMinutes,
      totalPay: totalPay.toFixed(2),
      byType,
    };
  };

  // --- Mount: load saved data and archive old month if necessary
  useEffect(() => {
    const now = new Date();
    const thisMonth = now.getMonth();
    setCurrentMonth(thisMonth);

    const storedEntries = JSON.parse(localStorage.getItem("entries") || "[]");
    const storedArchive = JSON.parse(localStorage.getItem("archive") || "[]");

    const storedMonthRaw = localStorage.getItem("month");
    const storedMonth = storedMonthRaw !== null ? parseInt(storedMonthRaw, 10) : NaN;

    // If there's a stored month and it's different, archive old entries
    if (!isNaN(storedMonth) && storedMonth !== thisMonth && storedEntries.length > 0) {
      // use storedMonth as the archived month; prefer the year from the first entry date if available
      let archiveYear = now.getFullYear();
      try {
        const firstDate = new Date(storedEntries[0].date);
        if (!isNaN(firstDate)) archiveYear = firstDate.getFullYear();
      } catch (err) {
        // fallback to current year
      }

      const summary = createSummaryFromEntries(storedEntries);

      const updatedArchive = [
        ...storedArchive,
        { month: storedMonth, year: archiveYear, summary },
      ];
      localStorage.setItem("archive", JSON.stringify(updatedArchive));
      setArchive(updatedArchive);

      // clear entries for the new month
      localStorage.setItem("entries", JSON.stringify([]));
      localStorage.setItem("month", thisMonth.toString());
      setEntries([]);
    } else {
      // Either the month matches, or no stored month — just load what's present
      setEntries(storedEntries);
      setArchive(storedArchive);

      // If there was never a stored month, initialize it
      if (isNaN(storedMonth)) {
        localStorage.setItem("month", thisMonth.toString());
      }
    }
  }, []);

  // Save entries and currentMonth whenever they change
  useEffect(() => {
    localStorage.setItem("entries", JSON.stringify(entries));
    localStorage.setItem("month", currentMonth.toString());
  }, [entries, currentMonth]);

  // Save archive whenever it changes
  useEffect(() => {
    localStorage.setItem("archive", JSON.stringify(archive));
  }, [archive]);

  // --- Called before adding an entry to ensure a month rollover is applied if needed
  const checkMonthChange = () => {
    const now = new Date();
    const thisMonth = now.getMonth();
    if (thisMonth !== currentMonth) {
      // Archive current `entries` (the ones that belong to the old month)
      if (entries.length > 0) {
        const summary = createSummaryFromEntries(entries);
        const updatedArchive = [
          ...archive,
          { month: currentMonth, year: now.getFullYear(), summary },
        ];
        setArchive(updatedArchive);
        localStorage.setItem("archive", JSON.stringify(updatedArchive));
      }

      // Reset entries for the new month
      setEntries([]);
      localStorage.setItem("entries", JSON.stringify([]));
      setCurrentMonth(thisMonth);
      localStorage.setItem("month", thisMonth.toString());
    }
  };

  // Add or update an entry
  const addEntry = () => {
    checkMonthChange(); // <= important: archive first if month changed

    if (serviceName && flatRate) {
      const newEntry = {
        id: Date.now(),
        date: date || new Date().toISOString().split("T")[0],
        workType: serviceName,
        isFlatRate: true,
        flatRate: parseFloat(flatRate),
        total: parseFloat(flatRate).toFixed(2),
      };
      setEntries((prev) => [newEntry, ...prev]);
      // sendToGoogleSheet(newEntry); // optional
    } else if (workType && minutes) {
      const time = parseFloat(minutes);
      if (isNaN(time)) {
        alert("Please enter a valid number for minutes.");
        return;
      }
      const total = ((time / 60) * fixedPayRate).toFixed(2);

      if (editingId !== null) {
        const updatedEntries = entries.map((entry) =>
          entry.id === editingId
            ? {
                ...entry,
                date: date || new Date().toISOString().split("T")[0],
                workType,
                minutes: time,
                total,
              }
            : entry
        );
        setEntries(updatedEntries);
        setEditingId(null);
      } else {
        const newEntry = {
          id: Date.now(),
          date: date || new Date().toISOString().split("T")[0],
          workType,
          minutes: time,
          payRate: fixedPayRate,
          total,
        };
        setEntries((prev) => [newEntry, ...prev]);
        // sendToGoogleSheet(newEntry);
      }
    } else {
      alert(
        "Please enter a Service Name and Flat Rate, OR select a Work Type and enter Minutes."
      );
      return;
    }

    // Reset fields
    setWorkType("");
    setMinutes("");
    setFlatRate("");
    setServiceName("");
    setDate("");
  };

  const getTotalMinutes = () =>
    entries.reduce((sum, e) => sum + (typeof e.minutes === "number" ? e.minutes : 0), 0);

  const getTotalPay = () =>
    entries.reduce((sum, e) => sum + (parseFloat(e.total) || 0), 0).toFixed(2);

  const getTotalsByType = () => {
    const grouped = {};
    entries.forEach((e) => {
      const type = e.workType || "Other";
      if (!grouped[type]) grouped[type] = { minutes: 0, total: 0 };
      if (typeof e.minutes === "number") grouped[type].minutes += e.minutes;
      grouped[type].total += parseFloat(e.total) || 0;
    });
    return grouped;
  };

  const sendToGoogleSheet = (entry) => {
    fetch(process.env.NEXT_PUBLIC_GOOGLE_SHEET_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(entry),
    })
      .then(() => {
        console.log("Data sent to Google Sheets (no response available)");
      })
      .catch((err) => console.error("Google Sheet error:", err));
  };

  const deleteEntry = (id) => {
    const updatedEntries = entries.filter((entry) => entry.id !== id);
    setEntries(updatedEntries);
  };

  return (
    <main className="max-w-2xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Forms</h1>
      {/* ... your links/buttons unchanged ... */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <a
          href={process.env.NEXT_PUBLIC_GOOGLE_FORM_CLASS}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 border border-blue-500 text-blue-500 rounded hover:bg-blue-50 transition"
        >
          <AcademicCapIcon className="w-5 h-5" />
          Class Time
        </a>
        <a
          href={process.env.NEXT_PUBLIC_GOOGLE_FORM_MENTOR}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 border border-blue-500 text-blue-500 rounded hover:bg-blue-50 transition"
        >
          <UserGroupIcon className="w-5 h-5" />
          Mentoring Time
        </a>
        <a
          href={process.env.NEXT_PUBLIC_GOOGLE_FORM_CLASS}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 border border-blue-500 text-blue-500 rounded hover:bg-blue-50 transition"
        >
          <ClipboardDocumentCheckIcon className="w-5 h-5" />
          Grading Time
        </a>
      </div>

      <h1 className="text-3xl font-bold mb-4">Time Tracker</h1>
      <input
        type="date"
        className="input input-bordered w-full"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />

      <div className="grid gap-3 mb-6">
        <input
          type="text"
          placeholder="Service Name (e.g., 'Website Design')"
          className="input input-bordered w-full"
          value={serviceName}
          onChange={(e) => setServiceName(e.target.value)}
        />
        <input
          type="number"
          placeholder="Flat Rate (e.g., 500)"
          className="input input-bordered w-full"
          value={flatRate}
          onChange={(e) => setFlatRate(e.target.value)}
        />
        <select
          className="select select-bordered w-full"
          value={workType}
          onChange={(e) => setWorkType(e.target.value)}
        >
          <option value="" disabled>
            Select Work Type
          </option>
          <option value="Class Time">Class Time</option>
          <option value="Mentoring Time">Mentoring Time</option>
          <option value="Grading Time">Grading Time</option>
        </select>

        <input
          type="number"
          placeholder="Minutes Worked"
          className="input input-bordered w-full"
          value={minutes}
          onChange={(e) => setMinutes(e.target.value)}
        />
        <input
          type="number"
          className="input input-bordered w-full"
          value={fixedPayRate}
          readOnly
        />

        <button className="btn btn-primary" onClick={addEntry}>
          {editingId !== null ? "Update Entry" : "Add Entry"}
        </button>
      </div>

      {/* Summary */}
      <div className="bg-base-200 p-4 rounded-lg shadow mb-6">
        <h2 className="text-xl font-bold mb-2">Summary</h2>
        <p>Total Sessions: {entries.length}</p>
        <p>
          Total Time: {getTotalMinutes()} minutes (
          {(getTotalMinutes() / 60).toFixed(2)} hours)
        </p>
        <p className="text-green-600 font-semibold">
          Total Earned: ${getTotalPay()}
        </p>

        <div className="mt-4">
          <h3 className="font-semibold mb-2">By Work Type:</h3>
          <ul className="list-disc pl-6">
            {Object.entries(getTotalsByType()).map(([type, stats]) => (
              <li key={type}>
                {type}: {stats.minutes} minutes (${stats.total.toFixed(2)})
              </li>
            ))}
          </ul>
        </div>

        {/* Archive Summary */}
        <div className="bg-base-200 p-4 rounded-lg shadow mb-6">
          <h2 className="text-xl font-bold mb-2">Archived Summaries</h2>
          {archive.length === 0 && <p>No archived months yet.</p>}
          {archive.map((monthData, index) => {
            const summary = monthData.summary;
            return (
              <div key={index} className="mb-4 border-b border-gray-300 pb-2">
                <h3 className="font-semibold mb-1">
                  {`${monthData.month + 1}/${monthData.year}`}
                </h3>
                <p>Total Entries: {summary.totalEntries}</p>
                <p>Total Time: {summary.totalMinutes} mins</p>
                <p className="text-green-600 font-semibold">
                  Total Earned: ${summary.totalPay}
                </p>
                <div className="mt-2 text-sm">
                  <p className="font-medium">By Work Type:</p>
                  <ul className="list-disc pl-4">
                    {Object.entries(summary.byType).map(([type, stats]) => (
                      <li key={type}>
                        {type}: {stats.minutes} mins (${stats.total.toFixed(2)})
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Time Cards */}
      <div className="bg-base-200 p-4 rounded-lg shadow mb-6">
        <ul className="space-y-4">
          <h2 className="text-xl font-bold mb-2">Time Cards</h2>
          {entries.map((entry) => (
            <li key={entry.id} className="card bg-base-100 shadow p-4">
              <p className="font-bold">{entry.date}</p>
              <p>Work: {entry.workType}</p>
              {entry.isFlatRate ? (
                <p className="text-lg font-semibold">
                  Flat Rate: ${entry.flatRate?.toFixed
                    ? entry.flatRate.toFixed(2)
                    : entry.flatRate}
                </p>
              ) : (
                <>
                  <p>Time: {entry.minutes} mins</p>
                  <p className="text-lg font-semibold">
                    Pay Rate: ${entry.payRate}/hr
                  </p>
                </>
              )}

              <p className="text-green-600 font-semibold">Pay: ${entry.total}</p>
              <div className="mt-2">
                <button
                  onClick={() => {
                    setWorkType(entry.workType);
                    setMinutes(entry.minutes !== undefined ? entry.minutes.toString() : "");
                    setDate(entry.date);
                    setEditingId(entry.id);
                  }}
                  className="btn btn-sm btn-info mr-4"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteEntry(entry.id)}
                  className="btn btn-sm btn-error"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
