import React, { useState } from "react";
import PropTypes from "prop-types";
import Button from "../button";
import Link from "next/link";

Employer.propTypes = {};

function Employer(props) {
  const [dataBlock] = useState({
    title: "Top Employers",
    text: "Showing companies based on reviews and recent job openings",
  });

  const { data } = props;
  const { className } = props;

  return (
    <section className={className}>
      <div className="tf-container">
        <div className="wd-employer">
          <div className="tf-title">
            <div className="group-title">
              <h1>{dataBlock.title}</h1>
              <p>{dataBlock.text}</p>
            </div>
            <Button title="All Employers" link="/employers_v1" />
          </div>

          {/* equal-height row: each col is a flex column, card stretches to fill */}
          <div className="row wow fadeInUp" style={{ alignItems: "stretch" }}>
            {data.map((idx) => (
              <div
                key={idx.id}
                className="col-xl-3 col-lg-4 col-md-6 col-sm-6"
                style={{ display: "flex", marginBottom: "24px" }}
              >
                <div
                  className="employer-block"
                  style={{ width: "100%", display: "flex", flexDirection: "column" }}
                >
                  <div
                    className="inner-box"
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "12px",
                      height: "100%",
                    }}
                  >
                    {/* Logo */}
                    <div className="logo-company" style={{ flexShrink: 0 }}>
                      {idx.img ? (
                        <img src={idx.img} alt="Jobtex" />
                      ) : (
                        <div
                          style={{
                            width: "54px",
                            height: "54px",
                            borderRadius: "8px",
                            background: "#eff6ff",
                            color: "#2563eb",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "18px",
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          {(idx.title || "?")
                            .split(" ")
                            .map((w) => w[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="box-content" style={{ flex: 1, minWidth: 0 }}>
                      <div className="star">
                        <span className="icon-star-full"></span>
                        <span className="icon-star-full"></span>
                        <span className="icon-star-full"></span>
                        <span className="icon-star-full"></span>
                        <span className="icon-star-full"></span>
                      </div>
                      <h3 style={{ wordBreak: "break-word" }}>
                        <Link href={`/employers/${idx.id}`}>{idx.title}</Link>
                        &nbsp;
                        <span className="icon-bolt"></span>
                      </h3>
                      <p className="info">
                        <span className="icon-map-pin"></span>
                        &nbsp;
                        {idx.map}
                      </p>
                    </div>
                  </div>

                  <Link
                    href={`/employers/${idx.id}`}
                    className="jobtex-link-item"
                    tabIndex="0"
                  ></Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Employer;
