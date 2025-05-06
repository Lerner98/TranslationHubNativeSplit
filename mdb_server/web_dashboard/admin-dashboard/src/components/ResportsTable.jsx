import React from 'react';
import './ReportsTable.css';

const ReportsTable = ({ reports }) => {
  if (!reports.length) {
    return <p>No reports available.</p>;
  }

  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Time</th>
            <th>Message</th>
            <th>Stack</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report, index) => (
            <tr key={index}>
              <td>{new Date(report.time).toLocaleString()}</td>
              <td>{report.message}</td>
              <td>
                <pre>{report.stack}</pre>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ReportsTable;
