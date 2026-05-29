import React from "react";
import PropTypes from "prop-types";
import Link from "next/link";

BlogSec1.propTypes = {};

function BlogSec1(props) {
  const { data } = props;
  return (
    <section>
      <div className="tf-container">
        <div className="blog wrap-blog stc">
          <div className="list-blog listBlog-wrap">
            {data.slice(4, 8).map((idx) => (
              <div key={idx.id} className="widget-blog-1">
                <img src={idx.img} alt="image" className="img-blog" />
                <div className="content">
                  <span className="sub-title">{idx.cate}</span>
                  <h3 className="main-title">
                    <Link href="/blogsingle_v1">{idx.title}</Link>
                  </h3>
                  <ul className="meta">
                    <li className="author">
                      <span>by</span>
                      {idx.author}
                    </li>
                    <li className="time">
                      <span className="icon-calendar"></span> {idx.time}
                    </li>
                  </ul>
                  <p>{idx.text}</p>
                  <div className="widget-button-underline">
                    <Link href="/blogsingle_v1">Read More</Link>
                  </div>
                </div>
              </div>
            ))}

            <ul className="pagination-job style-1">
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
          </div>
          <div className="widget-side-bar">
            <form
              role="search"
              method="get"
              action="#"
              className="widget-block-search-2"
            >
              <div className="widget-block-search-2-wrap">
                <input
                  type="search"
                  className="widget-block-search-2-input "
                  placeholder="Search"
                  required=""
                />
                <button type="submit" className="widget-block-search-2-button">
                  <span className="icon-search1"></span>
                </button>
              </div>
            </form>
            <div className="categories">
              <div className="main-title">Categories</div>
              <div className="categories-wrap">
                {data.slice(0, 4).map((idx) => (
                  <div key={idx.id} className="categories-item">
                    <Link href="/blog_v2">{idx.cate}</Link>
                  </div>
                ))}
              </div>
            </div>
            <div className="recent-posts">
              <div className="main-title">Recent Posts</div>
              <div className="recent-post-wrap">
                {data.slice(4, 7).map((idx) => (
                  <div key={idx.id} className="widget-blog-1">
                    <img src={idx.img} alt="image" className="img-blog" />
                    <div className="content">
                      <div className="sub-title">{idx.cate}</div>
                      <div className="text">
                        <Link href="/blogsingle_v1">{idx.title}</Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="widget-popular-tags">
              <div className="main-title">Popular Tags</div>
              <div className="widget-popular-tags-wrap">
                {data.slice(0, 8).map((idx) => (
                  <span key={idx.id} className="widget-popular-tags-item">
                    <Link href="/blog_v2">{idx.cate}</Link>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default BlogSec1;
