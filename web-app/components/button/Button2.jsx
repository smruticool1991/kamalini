import React from "react";
import PropTypes from "prop-types";
import Link from "next/link";

Button2.propTypes = {};

function Button2(props) {
  const { title, link } = props;
  return (
    <Link href={link} className="tf-button style-1">
      {title}
      <span className="icon-keyboard_arrow_right"></span>
    </Link>
  );
}

export default Button2;
