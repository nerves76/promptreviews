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

export type IconName = 'FaAddressBook' | 'FaAnchor' | 'FaAngry' | 'FaAnkh' | 'FaAppleAlt' | 'FaArrowLeft' | 'FaArrowRight' | 'FaArrowsAlt' | 'FaBars' | 'FaBell' | 'FaBoxOpen' | 'FaBug' | 'FaBuilding' | 'FaBusinessTime' | 'FaCalendarAlt' | 'FaCamera' | 'FaCaretDown' | 'FaCaretUp' | 'FaChartLine' | 'FaCheck' | 'FaCheckCircle' | 'FaChevronDown' | 'FaChevronLeft' | 'FaChevronRight' | 'FaChevronUp' | 'FaCircle' | 'FaClock' | 'FaCode' | 'FaCodeBranch' | 'FaCoffee' | 'FaCog' | 'FaColumns' | 'FaCommentAlt' | 'FaCommentDots' | 'FaComments' | 'FaCopy' | 'FaCreditCard' | 'FaDatabase' | 'FaEdit' | 'FaEnvelope' | 'FaExclamationTriangle' | 'FaEye' | 'FaEyeSlash' | 'FaFacebook' | 'FaFileAlt' | 'FaFilter' | 'FaFrown' | 'FaGlobe' | 'FaGrinHearts' | 'FaGoogle' | 'FaHandsHelping' | 'FaHandshake' | 'FaHeart' | 'FaHome' | 'FaImage' | 'FaInfoCircle' | 'FaKey' | 'FaLeaf' | 'FaLightbulb' | 'FaLink' | 'FaLock' | 'FaMapMarker' | 'FaMeh' | 'FaMinus' | 'FaMobile' | 'mushroom' | 'FaPalette' | 'FaPeace' | 'FaPhone' | 'FaPlus' | 'FaPlusCircle' | 'FaQrcode' | 'FaRedo' | 'FaRegStar' | 'FaRocket' | 'prompty' | 'FaSearch' | 'FaSentimentAnalyzer' | 'FaShare' | 'FaShieldAlt' | 'FaSignInAlt' | 'FaSignOutAlt' | 'FaSparkles' | 'FaSpinner' | 'FaStar' | 'FaStickyNote' | 'FaStore' | 'FaSun' | 'FaTags' | 'FaThumbsUp' | 'FaTimes' | 'FaTrash' | 'FaTripadvisor' | 'FaTools' | 'FaTrophy' | 'FaUnlock' | 'FaUpload' | 'FaUser' | 'FaUserCircle' | 'FaUserPlus' | 'FaUsers' | 'FaVideo' | 'FaWallet' | 'FaWrench' | 'FaYelp' | 'FaAmazon' | 'SiG2' | 'SiAngi' | 'MdDownload' | 'MdEvent' | 'MdLocationOn' | 'FiMoreHorizontal' | 'SiTrustpilot' | 'SiHouzz' | 'SiHomeadvisor' | 'FaDumbbell' | 'FaGlassCheers' | 'FaPagelines' | 'FaRainbow' | 'FaQuestionCircle' | 'FaGift' | 'FaBbb' | 'FaSave' | 'FaFavorites' | 'FaBookmark' | 'FiMenu' | 'FiX' | 'FaFeather' | 'FaSmile' | 'FaLinkedin' | 'FaXTwitter' | 'FaBluesky' | 'FaReddit' | 'FaPinterest' | 'FaSpellCheck';

export default Icon;
