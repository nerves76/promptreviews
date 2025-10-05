import React from 'react';

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
  color?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export const Icon: React.FC<IconProps> = ({ 
  name, 
  size = 16, 
  className = '', 
  color = 'currentColor',
  style = {},
  onClick 
}) => {
  const iconStyle = {
    width: size,
    height: size,
    fill: color,
    ...style
  };

  return (
    <svg 
      className={className}
      style={iconStyle}
      onClick={onClick}
      role={onClick ? 'button' : 'img'}
      aria-hidden={!onClick}
    >
      <use href={`#${name}`} />
    </svg>
  );
};

export type IconName = 'FaAddressBook' | 'FaAnchor' | 'FaAngry' | 'FaAnkh' | 'FaAppleAlt' | 'FaArrowLeft' | 'FaArrowRight' | 'FaArrowsAlt' | 'FaBars' | 'FaBell' | 'FaBoxOpen' | 'FaBug' | 'FaBuilding' | 'FaBusinessTime' | 'FaCalendarAlt' | 'FaCamera' | 'FaCaretDown' | 'FaCaretUp' | 'FaChartBar' | 'FaChartLine' | 'FaChartPie' | 'FaCheck' | 'FaCheckCircle' | 'FaChevronDown' | 'FaChevronLeft' | 'FaChevronRight' | 'FaChevronUp' | 'FaCircle' | 'FaClock' | 'FaCode' | 'FaCodeBranch' | 'FaCoffee' | 'FaCog' | 'FaCommentAlt' | 'FaCommentDots' | 'FaComments' | 'FaCopy' | 'FaCreditCard' | 'FaDatabase' | 'FaDownload' | 'FaEdit' | 'FaEnvelope' | 'FaExclamationCircle' | 'FaExclamationTriangle' | 'FaEye' | 'FaEyeSlash' | 'FaFacebook' | 'FaFileAlt' | 'FaFileInvoiceDollar' | 'FaFilter' | 'FaFrown' | 'FaGlobe' | 'FaGrinHearts' | 'FaGoogle' | 'FaHandsHelping' | 'FaHandshake' | 'FaHeart' | 'FaHistory' | 'FaHome' | 'FaImage' | 'FaInfoCircle' | 'FaKey' | 'FaLeaf' | 'FaLightbulb' | 'FaLink' | 'FaList' | 'FaLock' | 'FaMagic' | 'FaMapMarker' | 'FaMapMarkerAlt' | 'FaMegaphone' | 'FaMeh' | 'FaMinus' | 'FaMobile' | 'FaPalette' | 'FaPeace' | 'FaPhone' | 'FaPlus' | 'FaPlusCircle' | 'FaQrcode' | 'FaReceipt' | 'FaRedo' | 'FaRegSmile' | 'FaRegStar' | 'FaRobot' | 'FaRocket' | 'FaSpellCheck' | 'FaSync' | 'prompty' | 'FaSearch' | 'FaShare' | 'FaShieldAlt' | 'FaSignInAlt' | 'FaSignOutAlt' | 'FaSpinner' | 'FaStar' | 'FaStickyNote' | 'FaStore' | 'FaSun' | 'FaTags' | 'FaThumbsUp' | 'FaTimes' | 'FaTrash' | 'FaTripadvisor' | 'FaTrophy' | 'FaUndo' | 'FaUnlock' | 'FaUpload' | 'FaUser' | 'FaUserCircle' | 'FaUserPlus' | 'FaUsers' | 'FaVideo' | 'FaWallet' | 'FaWrench' | 'FaYelp' | 'FaAmazon' | 'SiG2' | 'SiAngi' | 'MdArrowDownward' | 'MdArrowUpward' | 'MdBarChart' | 'MdDownload' | 'MdEvent' | 'MdFlashOn' | 'MdList' | 'MdLocationOn' | 'MdReply' | 'FiMoreHorizontal' | 'SiTrustpilot' | 'SiHouzz' | 'SiHomeadvisor' | 'FaDumbbell' | 'FaGlassCheers' | 'FaPagelines' | 'FaRainbow' | 'FaQuestionCircle' | 'FaGift' | 'FaBbb' | 'FaSave' | 'FaFavorites' | 'FaBookmark' | 'FiMenu' | 'FiX' | 'FaFeather' | 'FaSmile' | 'FaReddit' | 'FaLinkedin' | 'FaPinterest' | 'FaBluesky' | 'FaXTwitter' | 'FaThumbtack' | 'FaRegCopyright';

export default Icon;
