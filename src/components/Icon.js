import React from 'react';
import * as FaIcons from 'react-icons/fa';
import * as FaSolidIcons from 'react-icons/fa6';
import * as HiIcons from 'react-icons/hi';
import * as IoIcons from 'react-icons/io5';

/**
 * Icon Component
 * 
 * A flexible icon component that supports multiple icon libraries from react-icons
 * 
 * Props:
 *   - name: string - The icon name (e.g., "FaHome", "HiUser", "IoSettings")
 *   - size: number - Icon size in pixels (default: 16)
 *   - color: string - Icon color (default: "currentColor")
 *   - className: string - Additional CSS classes
 *   - style: object - Inline styles
 *   - onClick: function - Click handler
 * 
 * Usage:
 *   <Icon name="FaHome" size={20} color="#333" />
 *   <Icon name="HiUserCircle" size={24} />
 *   <Icon name="IoSettingsOutline" />
 */

const Icon = ({ 
  name, 
  size = 16, 
  color = "currentColor", 
  className = "", 
  style = {},
  onClick = null,
  ...props 
}) => {
  // Combine all icon libraries
  const iconLibraries = {
    ...FaIcons,
    ...FaSolidIcons,
    ...HiIcons,
    ...IoIcons,
  };

  // Get the icon component
  const IconComponent = iconLibraries[name];

  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in available libraries`);
    return null;
  }

  return (
    <IconComponent
      size={size}
      color={color}
      className={className}
      style={{ ...style, display: 'inline-block' }}
      onClick={onClick}
      {...props}
    />
  );
};

export default Icon;

// Commonly used icons mapping for easy reference
export const iconMap = {
  // Navigation
  database: "FaDatabase",
  upload: "FaUpload",
  history: "FaHistory",
  chartLine: "FaChartLine",
  exclamationTriangle: "FaExclamationTriangle",
  barcode: "FaBarcode",
  industry: "FaIndustry",
  
  // Actions
  edit: "FaEdit",
  delete: "FaTrash",
  save: "FaSave",
  download: "FaDownload",
  search: "FaSearch",
  filter: "FaFilter",
  plus: "FaPlus",
  minus: "FaMinus",
  check: "FaCheck",
  times: "FaTimes",
  refresh: "FaSyncAlt",
  
  // Status
  checkCircle: "FaCheckCircle",
  timesCircle: "FaTimesCircle",
  exclamationCircle: "FaExclamationCircle",
  infoCircle: "FaInfoCircle",
  
  // Business
  chartBar: "FaChartBar",
  chartPie: "FaChartPie",
  
  // Interface
  cog: "FaCog",
  bell: "FaBell",
  envelope: "FaEnvelope",
  phone: "FaPhone",
  calendar: "FaCalendar",
  
  // Data
  table: "FaTable",
  file: "FaFile",
  fileCsv: "FaFileCsv",
  fileExcel: "FaFileExcel",
  filePdf: "FaFilePdf",
};



