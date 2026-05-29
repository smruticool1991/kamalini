import React from "react";

import {
  BrowserRouter as Router,
  Routes,
  Route,
  useRoutes,
} from "react-router-dom";
import Home_v1 from "./pages/Home_v1";
import Home_v2 from "./pages/Home_v2";
import Home_v3 from "./pages/Home_v3";
import Home_v4 from "./pages/Home_v4";
import Home_v5 from "./pages/Home_v5";
import Home_v6 from "./pages/Home_v6";
import Home_v7 from "./pages/Home_v7";
import Home_v8 from "./pages/Home_v8";
import Home_v9 from "./pages/Home_v9";
import Home_v10 from "./pages/Home_v10";
import Joblist_v1 from "./pages/Joblist_v1";
import Joblist_v2 from "./pages/Joblist_v2";
import Joblist_v3 from "./pages/Joblist_v3";
import Joblist_v4 from "./pages/Joblist_v4";
import Joblist_v5 from "./pages/Joblist_v5";
import Joblist_v6 from "./pages/Joblist_v6";
import Joblist_v7 from "./pages/Joblist_v7";
import Joblist_v8 from "./pages/Joblist_v8";
import Joblist_v9 from "./pages/Joblist_v9";
import Joblist_v10 from "./pages/Joblist_v10";

import Jobsingle_v1 from "./pages/Jobsingle_v1";
import Jobsingle_v2 from "./pages/Jobsingle_v2";
import Employer_v1 from "./pages/Employer_v1";
import Employer_v2 from "./pages/Employer_v2";
import Employer_v3 from "./pages/Employer_v3";
import Employer_v4 from "./pages/Employer_v4";
import Employer_v5 from "./pages/Employer_v5";
import Employer_v6 from "./pages/Employer_v6";
import Employer_v7 from "./pages/Employer_v7";
import Employersingle_v1 from "./pages/Employersingle_v1";
import Employersingle_v2 from "./pages/Employersingle_v2";
import EmployerReview from "./pages/EmployerReview";
import Employernotfound from "./pages/Employernotfound";
import Employerdashboard from "./pages/Employerdashboard";
import Candidates_v1 from "./pages/Candidates_v1";
import Candidates_v2 from "./pages/Candidates_v2";
import Candidates_v3 from "./pages/Candidates_v3";
import Candidates_v4 from "./pages/Candidates_v4";
import Candidates_v5 from "./pages/Candidates_v5";
import Candidates_v6 from "./pages/Candidates_v6";
import Candidates_v7 from "./pages/Candidates_v7";
import SampleCV from "./pages/SampleCV";
import SampleCVdetails from "./pages/SampleCVdetails";
import SampleCVslidebar from "./pages/SampleCVslidebar";
import Candidatesingle_v1 from "./pages/Candidatesingle_v1";
import Candidatesingle_v2 from "./pages/Candidatesingle_v2";
import Blog_v1 from "./pages/Blog_v1";
import Blog_v2 from "./pages/Blog_v2";
import Blog_v3 from "./pages/Blog_v3";
import Blogsingle_v1 from "./pages/Blogsingle_v1";
import Blogsingle_v2 from "./pages/Blogsingle_v2";
import Blogsingle_v3 from "./pages/Blogsingle_v3";
import Shop from "./pages/Shop";
import Shopsingle from "./pages/Shopsingle";
import Shoppingcart from "./pages/Shoppingcart";
import Checkout from "./pages/Checkout";
import AboutUs from "./pages/AboutUs";
import Faqs from "./pages/Faqs";
import Termsofuse from "./pages/Termsofuse";
import Pricing from "./pages/Pricing";
import Login from "./pages/Login";
import CreateAccount from "./pages/CreateAccount";
import ContactUs from "./pages/ContactUs";
import { useEffect } from "react";
import ScrollToTop from "./ScrollToTop";
import { useState } from "react";
import Preloader from "./components/preloader";

const App = () => {
  let routes = useRoutes([
    { path: "/", element: <Home_v1 /> },
    { path: "/home_v2", element: <Home_v2 /> },
    { path: "/home_v3", element: <Home_v3 /> },
    { path: "/home_v4", element: <Home_v4 /> },
    { path: "/home_v5", element: <Home_v5 /> },
    { path: "/home_v6", element: <Home_v6 /> },
    { path: "/home_v7", element: <Home_v7 /> },
    { path: "/home_v8", element: <Home_v8 /> },
    { path: "/home_v9", element: <Home_v9 /> },
    { path: "/home_v10", element: <Home_v10 /> },
    { path: "/joblist_v1", element: <Joblist_v1 /> },
    { path: "/job-grid", element: <Joblist_v2 /> },
    { path: "/job-list-sidebar", element: <Joblist_v3 /> },
    { path: "/job-grid-sidebar", element: <Joblist_v4 /> },
    { path: "/joblist_v5", element: <Joblist_v5 /> },
    { path: "/joblist_v6", element: <Joblist_v6 /> },
    { path: "/joblist_v7", element: <Joblist_v7 /> },
    { path: "/joblist_v8", element: <Joblist_v8 /> },
    { path: "/joblist_v9", element: <Joblist_v9 /> },
    { path: "/joblist_v10", element: <Joblist_v10 /> },
    { path: "/jobsingle_v1", element: <Jobsingle_v1 /> },
    { path: "/jobsingle_v2", element: <Jobsingle_v2 /> },
    { path: "/employers_v1", element: <Employer_v1 /> },
    { path: "/employers_v2", element: <Employer_v2 /> },
    { path: "/employers_v3", element: <Employer_v3 /> },
    { path: "/employers_v4", element: <Employer_v4 /> },
    { path: "/employers_v5", element: <Employer_v5 /> },
    { path: "/employers_v6", element: <Employer_v6 /> },
    { path: "/employers_v7", element: <Employer_v7 /> },
    { path: "/employersingle_v1", element: <Employersingle_v1 /> },
    { path: "/employersingle_v2", element: <Employersingle_v2 /> },
    { path: "/employerreview", element: <EmployerReview /> },
    { path: "/employernotfound", element: <Employernotfound /> },
    { path: "/employerdashboard", element: <Employerdashboard /> },
    { path: "/candidates_v1", element: <Candidates_v1 /> },
    { path: "/candidates_v2", element: <Candidates_v2 /> },
    { path: "/candidates_v3", element: <Candidates_v3 /> },
    { path: "/candidates_v4", element: <Candidates_v4 /> },
    { path: "/candidates_v5", element: <Candidates_v5 /> },
    { path: "/candidates_v6", element: <Candidates_v6 /> },
    { path: "/candidates_v7", element: <Candidates_v7 /> },
    { path: "/samplecv", element: <SampleCV /> },
    { path: "/samplecvdetails", element: <SampleCVdetails /> },
    { path: "/samplecvslidebar", element: <SampleCVslidebar /> },
    { path: "/candidatesingle_v1", element: <Candidatesingle_v1 /> },
    { path: "/candidatesingle_v2", element: <Candidatesingle_v2 /> },
    { path: "/blog_v1", element: <Blog_v1 /> },
    { path: "/blog_v2", element: <Blog_v2 /> },
    { path: "/blog_v3", element: <Blog_v3 /> },
    { path: "/blogsingle_v1", element: <Blogsingle_v1 /> },
    { path: "/blogsingle_v2", element: <Blogsingle_v2 /> },
    { path: "/blogsingle_v3", element: <Blogsingle_v3 /> },
    { path: "/shop", element: <Shop /> },
    { path: "/shopsingle", element: <Shopsingle /> },
    { path: "/shoppingcart", element: <Shoppingcart /> },
    { path: "/checkout", element: <Checkout /> },
    { path: "/aboutus", element: <AboutUs /> },
    { path: "/faqs", element: <Faqs /> },
    { path: "/termsofuse", element: <Termsofuse /> },
    { path: "/pricing", element: <Pricing /> },
    { path: "/login", element: <Login /> },
    { path: "/createaccount", element: <CreateAccount /> },
    { path: "/contactus", element: <ContactUs /> },
  ]);
  return routes;
};

const AppWrapper = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  return (
    <>
      {!loading ? (
        <Router>
          <ScrollToTop />
          <App />
        </Router>
      ) : (
        <Preloader />
      )}
    </>
  );
};

export default AppWrapper;
