import React, { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";   
import './profile.css';                      
import { EditIconSVG, EditProfileIconSVG } from "../../assets/svgComponents";
import Header from "../../components/Header";   
import EditProfile from "../../components/Form/EditProfile";
import { updateProfilePic } from "../../utils/helper";
import { updateUser } from "../../redux/action/auth";

const Profile = () => {      

  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);

  const imgRef = useRef();    
  const [file, setFile] = useState('');
  const [preview, setPreview] = useState('');    

  const handleImage = () => {        
    imgRef.current.click();   
  }
                                                   
  const checkFileUpload = useCallback(async () => {
    const image = await updateProfilePic(user, file);
    if(image){               
      dispatch(updateUser({ image }))  
      toast.success('Profile picture updated success')
      setFile('')     
    } else {                   
      toast.error('Something went wrong')
    }                           
  }, [dispatch, file])  

  useEffect(() => {
    if(user.image){                            
      setPreview(user.image);
    }
  }, [user])       
  
  useEffect(() => {     
    if(file){                         
      setPreview(URL.createObjectURL(file))
      checkFileUpload();             
    }                                   
  }, [file, checkFileUpload]) 

  return (
    <>
      <Header />
      <section className="body">
        <div className="container">
          <div className="row">   
            <div className="inner-wrap col-lg-6 bg-white mx-auto profile">
              <div className="wrap">
                <div className="text-center">
                  <input    
                    type="file" 
                    ref={imgRef}
                    accept="image/*" 
                    className="d-none" 
                    onChange={e => {
                      setFile(e.target.files[0])
                    }}                                    
                  />         
                  <div>
                    {                      
                      preview              
                      ?  
                      <div className="user_img" onClick={handleImage}>
                        <img src={preview} alt="" className="rounded rounded-circle" height={80} width={80} />
                        <div className="edit_userimg">
                        <EditIconSVG />                      
                        </div>                      
                      </div>                   
                      :
                      <div className="user_img" onClick={handleImage}>
                        <EditProfileIconSVG />
                        <div className="edit_userimg">
                        <EditIconSVG />                      
                        </div>
                      </div>
                    }               
                  </div>
                </div>     
                <EditProfile />
              </div>
            </div>
          </div>                        
        </div>                                 
      </section>
    </>
  );
};

export default Profile;
