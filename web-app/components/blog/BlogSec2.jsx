import React from 'react';
import PropTypes from 'prop-types';
import Link from 'next/link';

BlogSec2.propTypes = {
    
};

function BlogSec2(props) {
    const {data} = props
    return (
        <section className="blog-section">
    <div className="tf-container">
      <div className="group-col-3">
        {
            data.slice(3,12).map(idx => (
                <div key={idx.id} className="widget-blog-1 style-1 cl3 stc">
                    <div className="img-blog">
                    <img src={idx.img} alt="image" />
                    </div>
                    <div className="content">
                    <span className="sub-title">{idx.cate}</span>
                    <h3 className="main-title"><Link href="/blogsingle_v1">{idx.title}</Link></h3>
                    <ul className="meta">
                        <li className="author"><span>by</span>{idx.author}</li>
                        <li className="time"><span className="icon-calendar"></span> {idx.time}</li>
                    </ul>
                    </div>
                </div>
            ))
        }
       

      </div>
      <ul className="pagination-job">
        <li><Link href="#"><i className="icon-keyboard_arrow_left"></i></Link></li>
        <li><Link href="#">1</Link></li>
        <li className="current"><Link href="#">2</Link></li>
        <li><Link href="#">3</Link></li>
        <li><Link href="#"><i className="icon-keyboard_arrow_right"></i></Link></li>
      </ul>
    </div>

  </section>
    );
}

export default BlogSec2;