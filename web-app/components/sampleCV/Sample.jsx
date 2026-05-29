import React from "react";
import PropTypes from "prop-types";
import Link from "next/link";
import SortBuy from "../dropdown/SortBuy";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";

Sample.propTypes = {};

function Sample(props) {
  const { data } = props;
  return (
    <section className="candidate-cv-section">
      <div className="tf-container">
        <div className="row">
          <Tabs className="col-lg-12 tf-tab">
            <div className="wd-meta-select-job">
              <div className="wd-findjob-filer">
                <div className="group-select-display">
                  <TabList className="menu-tab cv-stc">
                    <Tab className="ct-tab"> Popularity CV</Tab>
                    <Tab className="ct-tab">Personalized CV</Tab>
                  </TabList>
                </div>
                <SortBuy />
              </div>
            </div>
            <div className="content-tab">
              <TabPanel className="inner animation-tab">
                <div className="group-col-3">
                  {data.map((idx) => (
                    <div key={idx.id} className="wd-cv-template cl3">
                      <div className="features">
                        <Link href="#">
                          <img src={idx.img} alt="images" />
                        </Link>
                      </div>
                      <div className="content">
                        <div className="top-content">
                          <ul className="list-category">
                            <li>
                              <Link href="#">Create</Link>
                            </li>
                            <li>
                              <Link href="#">Professionally</Link>
                            </li>
                            <li>
                              <Link href="#">Minimal</Link>
                            </li>
                          </ul>
                          <Link href="#" className="heart-btn">
                            <i className="icon-heart"></i>
                          </Link>
                        </div>
                        <h6>
                          <Link href="#">basic CV</Link>
                        </h6>
                        <div className="bottom-content">
                          <ul className="list-select">
                            <li>
                              <Link href="#" className="sl1"></Link>
                            </li>
                            <li>
                              <Link href="#" className="sl2"></Link>
                            </li>
                            <li>
                              <Link href="#" className="sl3"></Link>
                            </li>
                            <li>
                              <Link href="#" className="sl4"></Link>
                            </li>
                          </ul>
                          <Link href="#" className="tf-btn">
                            Use CV
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <ul className="pagination-job padding">
                  <li>
                    <Link href="#">
                      <i className="icon-keyboard_arrow_left"></i>
                    </Link>
                  </li>
                  <li>
                    <Link href="#">1</Link>
                  </li>
                  <li className="current">
                    <Link href="#">2</Link>
                  </li>
                  <li>
                    <Link href="#">3</Link>
                  </li>
                  <li>
                    <Link href="#">
                      <i className="icon-keyboard_arrow_right"></i>
                    </Link>
                  </li>
                </ul>
              </TabPanel>
              <TabPanel className="inner animation-tab">
                <div className="group-col-3">
                  {data.slice(0, 3).map((idx) => (
                    <div key={idx.id} className="wd-cv-template cl3">
                      <div className="features">
                        <Link href="#">
                          <img src={idx.img} alt="images" />
                        </Link>
                      </div>
                      <div className="content">
                        <div className="top-content">
                          <ul className="list-category">
                            <li>
                              <Link href="#">Create</Link>
                            </li>
                            <li>
                              <Link href="#">Professionally</Link>
                            </li>
                            <li>
                              <Link href="#">Minimal</Link>
                            </li>
                          </ul>
                          <Link href="#" className="heart-btn">
                            <i className="icon-heart"></i>
                          </Link>
                        </div>
                        <h6>
                          <Link href="#">basic CV</Link>
                        </h6>
                        <div className="bottom-content">
                          <ul className="list-select">
                            <li>
                              <Link href="#" className="sl1"></Link>
                            </li>
                            <li>
                              <Link href="#" className="sl2"></Link>
                            </li>
                            <li>
                              <Link href="#" className="sl3"></Link>
                            </li>
                            <li>
                              <Link href="#" className="sl4"></Link>
                            </li>
                          </ul>
                          <Link href="#" className="tf-btn">
                            Use CV
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <ul className="pagination-job padding">
                  <li>
                    <Link href="#">
                      <i className="icon-keyboard_arrow_left"></i>
                    </Link>
                  </li>
                  <li>
                    <Link href="#">1</Link>
                  </li>
                  <li className="current">
                    <Link href="#">2</Link>
                  </li>
                  <li>
                    <Link href="#">3</Link>
                  </li>
                  <li>
                    <Link href="#">
                      <i className="icon-keyboard_arrow_right"></i>
                    </Link>
                  </li>
                </ul>
              </TabPanel>
            </div>
          </Tabs>
        </div>
      </div>
    </section>
  );
}

export default Sample;
