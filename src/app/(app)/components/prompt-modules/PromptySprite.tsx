/**
 * Prompty Sprite Icon Component
 * 
 * A React component wrapper for the prompty SVG sprite icon
 * to make it compatible with react-icons IconType interface
 */

import React from "react";
import { IconType } from "react-icons";

const PromptySprite: IconType = (props) => {
  return (
    <svg
      viewBox="0 0 60 60"
      fill="currentColor"
      height="1em"
      width="1em"
      {...props}
    >
      <use href="/icons-sprite.svg#prompty" />
    </svg>
  );
};

export default PromptySprite;