import { useState } from "react";
import "./App.css";

function App() {
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [error, setError] = useState("");

  const [dataServer, setDataServer] = useState("MCU/TA KPI");
  const [agentName, setAgentName] = useState("");
  // DROPDOWN STATES
  const [selectedSite, setSelectedSite] = useState("VMD");
  const [selectedPlant, setSelectedPlant] = useState("NCP");

  const [scheduleTime, setScheduleTime] = useState("09:00");
  const [scheduleType, setScheduleType] = useState("weekly");

  const [selectedModel, setSelectedModel] = useState("llama 3");

  const [personEmail, setPersonEmail] = useState("");

  const [executeLoading, setExecuteLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  const [selectedTemplate, setSelectedTemplate] = useState("summarised");
  const [customPrompt, setCustomPrompt] = useState("");
  const [showReport, setShowReport] = useState(false);

  // SITE-PLANT MAPPING
  const sitePlantMapping = {
    VMD: ["NCP", "VCM", "PPCP", "LDPE"],
    HMD: ["CRACKER", "PP", "VCM", "PVC"],
  };

  const handleSiteChange = (e) => {
    const site = e.target.value;
    setSelectedSite(site);
    setSelectedPlant(sitePlantMapping[site][0]);
  };
  //Future Feature: Execution logs 
  //const [showLogs, setShowLogs] = useState(false);
  //const [configLogs, setConfigLogs] = useState([]);

  const [agentHistory, setAgentHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  // Login Function
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!employeeId || !password) {
      setError("Please fill all details");
      return;
    }

    setIsLoggedIn(true);
  };

  // Logout Function
  const handleLogout = () => {
    setIsLoggedIn(false);
    setEmployeeId("");
    setPassword("");
    setError("");
    setShowReport(false);
  };
  const validateInputs = () => {

    if (!agentName.trim()) {
      setToast({
        show: true,
        type: "error",
        message: "Please enter Agent Name."
      });
      return false;
    }

    if (!personEmail.trim()) {
      setToast({
        show: true,
        type: "error",
        message: "Please enter at least one email."
      });
      return false;
    }

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+(,\s*[^\s@]+@[^\s@]+\.[^\s@]+)*$/;

    if (!emailPattern.test(personEmail)) {
      setToast({
        show: true,
        type: "error",
        message: "Please enter valid email address(es)."
      });
      return false;
    }

    if (
      selectedTemplate === "custom" &&
      !customPrompt.trim()
    ) {
      setToast({
        show: true,
        type: "error",
        message: "Please enter a custom prompt."
      });
      return false;
    }

    return true;
  };
  // Execute Now backend logic
  const handleExecuteNow = async () => {

    if (!validateInputs()) {
      return;
    }

    setExecuteLoading(true);
    try {
      const response = await fetch("http://localhost:8000/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          site: selectedSite,
          plant: selectedPlant,
          emails: personEmail,
          template: selectedTemplate,
          model: selectedModel,
          scheduleType: scheduleType,
          scheduleTime: scheduleTime,
          customPrompt: customPrompt,
        }),
      });

      const data = await response.json();

      setToast({
        show: true,
        type: "success",
        message: data.message,
      });

    } catch (error) {
      console.error(error);
      setToast({
        show: true,
        type: "error",
        message: "Failed to connect to backend",
      });
    } finally {
      setExecuteLoading(false);
    }
  };
  const handleSaveConfiguration = async () => {
    if (!validateInputs()) {
      return;
    }
    setSaveLoading(true);
    try {
      const response = await fetch(
        "http://localhost:8000/schedule-report",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            agentName: agentName,
            site: selectedSite,
            plant: selectedPlant,
            emails: personEmail,
            template: selectedTemplate,
            model: selectedModel,
            scheduleType: scheduleType,
            scheduleTime: scheduleTime,
            customPrompt: customPrompt,
          }),
        }
      );

      const data = await response.json();

      setToast({
        show: true,
        type: "success",
        message: data.message,
      });

    } catch (error) {
      console.error(error);
      setToast({
        show: true,
        type: "error",
        message: "Failed to save schedule",
      });
    }
    finally {
      setSaveLoading(false);
    }
  };

  const fetchConfigurations = async () => {

    if (showHistory) {
      setShowHistory(false);
      return;
    }
    if (!agentName.trim()) {
      setAgentHistory([]);
      setShowHistory(true);
      return;
    }
    console.log("Agent Name:", agentName);
    try {
      const response = await fetch(
        `http://localhost:8000/configurations/${agentName}`
      );

      const data = await response.json();

      console.log(data);

      setAgentHistory(data);
      setShowHistory(true);

    } catch (error) {
      console.error(error);
      setToast({
        show: true,
        type: "error",
        message: "Failed to load workflows",
      });
    }
  };

  // Close Modal Handler
  const closeModal = () => {
    setShowReport(false);
  };

  return (
    <div className="App">
      {toast.show && (
        <div
          className={`toast ${toast.type}`}
          onAnimationEnd={() =>
            setToast({ ...toast, show: false })
          }
        >
          {toast.message}
        </div>
      )}
      <div className={`dashboard-shell ${showReport ? "blurred-background" : ""}`}>
        {isLoggedIn ? (
          <>
            {/* Header */}
            <div className="dashboard-header">
              <h1 className="dashboard-title">
                AI Based Workflow Configuration Module
              </h1>
              <button className="logout-button" onClick={handleLogout}>
                Logout
              </button>
            </div>

            {/* Top Controls */}
            <div className="dashboard-controls-row">
              <div className="field-group small-field">
                <label>Agent Name</label>
                <input
                  type="text"
                  className={!agentName.trim() ? "input-error" : ""}
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  placeholder="Plant KPI Agent"
                />
              </div>
              <div className="field-group">
                <label>Data Source / App. Name</label>
                <select
                  value={dataServer}
                  onChange={(e) => setDataServer(e.target.value)}
                >
                  <option>MCU/TA KPI</option>
                  <option>PAS/Signature</option>
                  <option>HFOM Log Board</option>
                  <option>Reports</option>
                  <option>Configuration</option>
                </select>
              </div>

              {/* SITE DROPDOWN */}
              <div className="field-group site-field">
                <label style={{ minWidth: "auto" }}>Site</label>
                <select value={selectedSite} onChange={handleSiteChange}>
                  <option value="VMD">VMD</option>
                  <option value="HMD">HMD</option>
                </select>
              </div>

              {/* PLANT DROPDOWN */}
              <div className="field-group plant-field">
                <label style={{ minWidth: "auto" }}>Plant</label>
                <select
                  value={selectedPlant}
                  onChange={(e) => setSelectedPlant(e.target.value)}
                >
                  {sitePlantMapping[selectedSite].map((plant) => (
                    <option key={plant} value={plant}>
                      {plant}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field-group">
                <label>Schedule Type</label>

                <select
                  value={scheduleType}
                  onChange={(e) => setScheduleType(e.target.value)}
                >
                  <option value="weekly">Weekly (Monday)</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div className="field-group time-save-group">
                <label>Time</label>
                <div className="time-save-row">
                  <input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                  />

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <label>Model</label>
                    <select
                      className="model-select"
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                    >
                      <option value="llama 3">LLaMA 3</option>
                      <option value="qwen 3">Qwen 3</option>
                    </select>
                  </div>

                  <button
                    className="save-button"
                    onClick={handleSaveConfiguration}
                    disabled={saveLoading}
                  >
                    {saveLoading ? (
                      <>
                        <span className="button-spinner"></span>
                        Saving...
                      </>
                    ) : (
                      "Save Workflow"
                    )}
                  </button>

                  <button
                    className="execute-now-button"
                    onClick={handleExecuteNow}
                    disabled={executeLoading}
                  >
                    {executeLoading ? (
                      <>
                        <span className="button-spinner"></span>
                        Generating...
                      </>
                    ) : (
                      "Execute Now"
                    )}
                  </button>
                </div>
              </div>
              <div className="workflow-section">
                <span className="workflow-label">
                  Your Workflows
                </span>

                <div className="view-config-container">
                  <button
                    className="view-config-btn"
                    onClick={fetchConfigurations}
                  >
                    View Workflows
                  </button>

                  {showHistory && (
                    <div className="agent-history">
                      {agentHistory.length > 0 ? (
                        agentHistory.map((item, index) => (
                          <div key={index} className="workflow-item">

                            <span className="workflow-agent">
                              {item.agentName}
                            </span>

                            <span className="workflow-separator">
                              {" | "}
                            </span>

                            <span>
                              {item.site} - {item.plant} - {item.scheduleType}
                            </span>

                          </div>
                        ))
                      ) : (
                        <div className="empty-workflow">
                          <div className="empty-title">
                            Click  <strong>Save Workflow</strong> to create one.
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>


            {/* Email Section */}
            <div className="email-section">
              <label>Email Subscriptions</label>
              <input
                type="email"
                className={!personEmail.trim() ? "input-error" : ""}
                placeholder="example@company.com , example2@company.com ..."
                value={personEmail}
                onChange={(e) => setPersonEmail(e.target.value)}
              />
            </div>

            {/* Template Cards */}
            <div className="template-wrapper">
              {/* TEMPLATE 1: SUMMARISED */}
              <div
                className={
                  selectedTemplate === "summarised"
                    ? "template-card active-card"
                    : "template-card"
                }
                onClick={() => setSelectedTemplate("summarised")}
              >
                <div className="card-header-row">
                  <input
                    type="radio"
                    name="Template"
                    checked={selectedTemplate === "summarised"}
                    readOnly
                  />
                  <h3>SUMMARISED REPORT</h3>
                </div>
                <p>
                  Generate professional management-level operational reports
                  from industrial production data.
                </p>
                <button
                  className="sample-report-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTemplate("summarised");
                    setShowReport(true);
                  }}
                >
                  Click me to see sample report
                </button>
              </div>

              {/* TEMPLATE 2: TABLE WISE */}
              <div
                className={
                  selectedTemplate === "tablewise"
                    ? "template-card active-card"
                    : "template-card"
                }
                onClick={() => setSelectedTemplate("tablewise")}
              >
                <div className="card-header-row">
                  <input
                    type="radio"
                    name="Template"
                    checked={selectedTemplate === "tablewise"}
                    readOnly
                  />
                  <h3>TABLE WISE</h3>
                </div>
                <p>
                  Generate concise table-format reports from manufacturing and
                  operational datasets.
                </p>
                <button
                  className="sample-report-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTemplate("tablewise");
                    setShowReport(true);
                  }}
                >
                  Click me to see sample report
                </button>
              </div>

              {/* TEMPLATE 3: CUSTOM PROMPT */}
              <div
                className={
                  selectedTemplate === "custom"
                    ? "template-card active-card"
                    : "template-card"
                }
                onClick={() => setSelectedTemplate("custom")}
              >
                <div className="card-header-row">
                  <input
                    type="radio"
                    name="Template"
                    checked={selectedTemplate === "custom"}
                    readOnly
                  />
                  <h3>CUSTOM PROMPT</h3>
                </div>
                <p>
                  Create configurable AI-generated reports with KPI summaries.
                </p>
                <textarea
                  className={
                    selectedTemplate === "custom" &&
                      !customPrompt.trim()
                      ? "input-error"
                      : ""
                  }
                  placeholder="Enter custom prompt here..."
                  rows={2}
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  disabled={selectedTemplate !== "custom"}
                  onClick={(e) => e.stopPropagation()}
                />
                <button
                  className="sample-report-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTemplate("custom");
                    setShowReport(true);
                  }}
                >
                  Click me to see sample report
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="login-card">
            <h2>Employee Login</h2>
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleLogin}>
              <div className="login-field">
                <label>Employee Name / Domain ID</label>
                <input
                  type="text"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder="fname.lastname / fname.lastname@domain"
                />
              </div>
              <div className="login-field">
                <label>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                />
              </div>
              <button type="submit" className="login-button">
                Sign In
              </button>
            </form>
          </div>
        )}
      </div>

      {/* POPUP COMPONENT */}
      {showReport && selectedTemplate && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className={`modal-content ${selectedTemplate === "custom" || selectedTemplate === "tablewise"
              ? "custom-modal-width"
              : ""
              }`}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="modal-close-button" onClick={closeModal}>
              &times;
            </button>

            <div className="report-output-container">
              {/* Short Header Banner */}
              <div className="report-output-header">
                <h1>{scheduleType === "weekly" ? "Weekly" : "Monthly"} Operations Report</h1>
                <p>
                  <strong>Date of Issue:</strong>{" "}
                  {new Date().toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                  {" | "}
                  <strong>Reporting Period:</strong>{" "}
                  {scheduleType === "weekly"
                    ? `Week ${Math.ceil(new Date().getDate() / 7)}`
                    : new Date().toLocaleString("default", { month: "long" })}
                </p>

                <p style={{ marginTop: "4px", fontSize: "12px", color: "#0037ad", background: "#eff6ff", padding: "8px 12px", borderRadius: "6px", display: "inline-block" }}>
                  <strong>To:</strong> {personEmail ? personEmail : "[No emails entered yet]"}
                </p>
              </div>

              <hr className="report-divider" />

              {/* VIEW 1: SUMMARISED TEMPLATE*/}
              {selectedTemplate === "summarised" && (
                <div className="report-view-fade">
                  <div className="report-section">
                    <div style={{ background: "#fafafa", padding: "20px", borderRadius: "8px", border: "1px solid #e2e8f0", color: "#334155", lineHeight: "1.6", fontSize: "14px" }}>
                      <p><strong>Subject:</strong> {scheduleType === "weekly" ? "Weekly" : "Monthly"} Highlight Report for {dataServer} – Powered by Generative AI</p>
                      <p>Dear Plant Manager,</p>
                      <p><strong>{scheduleType === "weekly" ? "Weekly" : "Monthly"} Highlights Report for {dataServer} Plant</strong></p>
                      <p><strong>{scheduleType === "weekly" ? "Week" : "Month"} Ending:</strong> {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</p>
                      <p><strong>Summary:</strong></p>
                      <p>{"{Generate executive summary of overall " + (scheduleType === "weekly" ? "weekly" : "monthly") + " performance.}"}</p>

                      <p><strong>Key Highlights:</strong></p>
                      <ul style={{ paddingLeft: "20px", marginTop: "8px" }}>
                        <li style={{ marginBottom: "12px" }}>
                          <strong>Production:</strong>
                          {"{Mention average daily production and total production achieved during the " + (scheduleType === "weekly" ? "week" : "month") + ".}"}
                        </li>
                        <li style={{ marginBottom: "12px" }}>
                          <strong>Losses:</strong><br />
                          {"{Mention total losses observed during the " + (scheduleType === "weekly" ? "week" : "month") + ".}"}
                          <ul style={{ paddingLeft: "20px", marginTop: "6px", listStyleType: "circle" }}>
                            <li>{"{Major operational issue 1}"}</li>
                            <li>{"{Major operational issue 2}"}</li>
                            <li>{"{Major operational issue 3}"}</li>
                          </ul>
                        </li>
                        <li style={{ marginBottom: "12px" }}>
                          <strong>Gains:</strong>
                          {"{Mention positive variances, stable operations, or recovery trends.}"}
                        </li>
                        <li style={{ marginBottom: "12px" }}>
                          <strong>Operational Insights:</strong>
                          {"{Mention operational resilience, recurring bottlenecks, recovery trend, stability improvements, etc.}"}
                        </li>
                      </ul>
                      <br />
                      <p><strong>Closing Remark:</strong></p>
                      <p>{"The operational performance for the " + (scheduleType === "weekly" ? "week" : "month") + " has been commendable, with several key achievements and areas for improvement identified."}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* VIEW 2: TABLE FORMAT */}
              {selectedTemplate === "tablewise" && (
                <div className="report-view-fade">
                  <div className="report-section">
                    <p><strong>Subject:</strong> {scheduleType === "weekly" ? "Weekly" : "Monthly"} Highlight Report for {dataServer} – Powered by Generative AI</p>
                    <p><strong>{scheduleType === "weekly" ? "Weekly" : "Monthly"} Highlights Report for {dataServer} Plant</strong></p>
                    <h3>Operational Analysis Metrics ({dataServer})</h3>
                    <table className="report-data-table">
                      <thead>
                        <tr>
                          <th>Operational KPI</th>
                          <th>Target Baseline</th>
                          <th>Actual Value</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td><strong>System Throughput</strong></td>
                          <td>12,500 units/hr</td>
                          <td>12,937 units/hr</td>
                          <td className="text-success">+3.5%</td>
                        </tr>
                        <tr>
                          <td><strong>Equipment OEE</strong></td>
                          <td>85.0%</td>
                          <td>88.7%</td>
                          <td className="text-success">+3.7%</td>
                        </tr>
                        <tr>
                          <td><strong>Unplanned Idle Time</strong></td>
                          <td>&lt; 30 Mins</td>
                          <td>14 Mins</td>
                          <td className="text-success">Passed</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* VIEW 3: CUSTOM PROMPT TEMPLATE */}
              {selectedTemplate === "custom" && (
                <div className="report-view-fade">
                  <div className="report-section">
                    <p><strong>Subject:</strong> {scheduleType === "weekly" ? "Weekly" : "Monthly"} Highlight Report for {dataServer} – Powered by Generative AI</p>
                    <p><strong>{scheduleType === "weekly" ? "Weekly" : "Monthly"} Highlights Report for {dataServer} Plant</strong></p>
                    <h3>Custom Prompt Parameters</h3>
                    <div className="custom-prompt-echo">
                      <strong>Directives applied:</strong> "{customPrompt || "No custom instruction saved."}"
                    </div>
                    <p style={{ fontSize: "14px", color: "#555" }}>
                      Data strings from telemetry system <strong>{dataServer}</strong> have been extracted and mapped to match targeted structural logic.
                    </p>
                  </div>
                  <p><strong>Closing Remark:</strong></p>
                  <p>{"The operational performance for the " + (scheduleType === "weekly" ? "week" : "month") + " has been commendable, with several key achievements and areas for improvement identified."}</p>
                </div>
              )}

              {/* PRODUCTIVITY SUMMARY TABLE - RESTRICTED TO TABLEWISE */}
              {selectedTemplate === "tablewise" && (
                <div className="report-section">
                  <h3>Productivity Metrics Table</h3>
                  <table className="report-data-table">
                    <thead>
                      <tr>
                        <th>Operational Sites</th>
                        <th>Manual Processing Time</th>
                        <th>Frequency</th>
                        <th>Annual Saved Hours</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>12 Facilities</td>
                        <td>4.5 Hours / Report</td>
                        <td>{scheduleType === "weekly" ? "Weekly" : "Monthly"}</td>
                        <td>2,808 Hours</td>
                      </tr>
                      <tr>
                        <td><strong>Enterprise Total</strong></td>
                        <td><strong>4.5 Hours</strong></td>
                        <td><strong>Continuous</strong></td>
                        <td><strong>3,192 Hours / Yr</strong></td>
                      </tr>
                    </tbody>
                  </table>
                  <p><strong>Closing Remark:</strong></p>
                  <p>{"The operational performance for the " + (scheduleType === "weekly" ? "week" : "month") + " has been commendable, with several key achievements and areas for improvement identified."}</p>
                </div>
              )}

              {/* Small AI Bottom Banner */}
              <div className="report-ai-note">
                <p>NOTE: Generated via AI {selectedModel.toUpperCase()} Framework.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default App;
/* ===============================================================
                    FRONTEND SETUP & RUN GUIDE


PREREQUISITES

1. Install Node.js (LTS version)
   https://nodejs.org/

2. Verify installation:

      node -v
      npm -v

==================================================================
INSTALL PROJECT DEPENDENCIES

Navigate to the React project directory and install all required
dependencies:

      npm install

This command installs all packages listed in the project's
package.json file, including React and other required libraries.

If the node_modules folder is missing, corrupted, or dependencies
are not installed correctly, delete the following:

      node_modules
      package-lock.json

Then reinstall all dependencies by running:

      npm install

==================================================================
START THE REACT APPLICATION

Run:

      npm start

The React development server will start.

By default, the application is available at:

      http://localhost:3000

Note:
If port 3000 is already in use, React may automatically use another
available port (for example, 3001).

==================================================================
BACKEND REQUIREMENT

The frontend communicates with the FastAPI backend.

Ensure the backend server is running before using the UI.

Start the backend using:

      python -m uvicorn mainAPI:app --reload

or

      uvicorn mainAPI:app --reload

The default backend URL during development is:

      http://localhost:8000

If the backend is running on a different host or port,
update the API URL used in the fetch() requests.

==================================================================
PROJECT EXECUTION FLOW

1. Start the FastAPI backend.

2. Start the React frontend.

3. Open the application in your browser.

4. Login using employee credentials.

5. Configure:
      • Agent Name
      • Data Source
      • Site
      • Plant
      • Schedule
      • Model
      • Email Recipients
      • Report Template

6. Click:
      • Execute Now
            Generates the report immediately and sends emails.

      • Save Workflow
            Saves the workflow configuration and schedules
            automatic report generation.

      • View Workflows
            Displays previously saved workflows for the
            selected Agent Name.

==================================================================
TROUBLESHOOTING

React server not starting:

      npm install
      npm start

Backend connection error:

• Verify FastAPI is running.
• Verify the backend URL and port.
• Ensure CORS is enabled.
• Ensure no firewall is blocking the connection.

Dependency issues:

Delete:

      node_modules
      package-lock.json

Then reinstall:

      npm install

==================================================================
FUTURE ENHANCEMENTS

• Fetch configuration data from a centralized database.
• Add workflow Edit/Delete/Search functionality.
• Add execution history and monitoring.
• Integrate enterprise authentication (LDAP/SSO).
• Replace hardcoded API URLs using environment variables.
• Support additional AI models and report templates.
• Add real-time execution logs using WebSockets/SSE.

================================================================ */