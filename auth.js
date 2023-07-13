import { toast } from 'react-toastify';
import { auth } from '../../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail, sendEmailVerification } from 'firebase/auth';
import { checkDomainAccess, checkDomainAndHandleCases, createDBLogs, getUserDoc, updateUserDocument, validateFirebaseLink } from '../../utils/helper';
import { 
    AUTH_LOADING,
    AUTH_SUCCESS,
    AUTH_ERROR,
    ACCESS_TYPE,
    USER_LOGOUT,
    USER_LOGIN,
    UPDATE_USER,              
} from '../types';    

export const signUp = (body) => async (dispatch) => {
    dispatch({ type: AUTH_LOADING })
    try {
        const userCred = await createUserWithEmailAndPassword(auth, body.email, body.password);
        const userCreated = await checkDomainAndHandleCases(body, userCred.user.uid);     
    
        if(userCreated){  
            dispatch({ type: AUTH_SUCCESS });
            return true;
        } else {           
            dispatch({ type: AUTH_ERROR })
            toast.error('Unauthenticated Email')
            return false;
        }  

    } catch (err) {  
        dispatch({ type: AUTH_ERROR })
        if(err.code === 'auth/email-already-in-use'){
            toast.error('Email already registered')
        } else {
            toast.error('Something went wrong')
        }
        return false;
    }            
}

export const login = (body) => async (dispatch) => {
    dispatch({ type: AUTH_LOADING })
    try {
        // Get AuthUser
        const userCredential = await signInWithEmailAndPassword(auth, body.email, body.password)       
        const user = await getUserDoc(userCredential);

        if(!user){
            dispatch({ type: AUTH_ERROR })
            toast.error('User not Found');
            return false;
        }

        // Generate DB Logs 
        await createDBLogs(body, user);

        // Check Access
        let access = await checkDomainAccess(body, user)

        // Maintain Auth User
        dispatch({ type: ACCESS_TYPE, payload: access })
        dispatch({ type: USER_LOGIN, payload: user })

        toast.success('User login success')
        return true;
    } catch (error) {    
      console.log(error);
      dispatch({ type: AUTH_ERROR })
      if(error.code === 'auth/user-not-found'){
        toast.error('Invalid credentials') 
      } else if(error.code === 'auth/wrong-password') {
        toast.error('Invalid credentials')
      } else {                    
        toast.error('Something went wrong')
      }
      return false;
    }    
}   

export const logOut = () => async (dispatch) => {
    // dispatch({ type: AUTH_LOADING })
    signOut(auth)
    .then(() => {
        toast.success('User logout success')
        dispatch({ type: USER_LOGOUT });
    })   
    .catch(error => {
        dispatch({ type: AUTH_ERROR })
        toast.error('Something went wrong')
    }) 
}

export const sendResetPasswordEmail = (email) => async (dispatch) => {
    dispatch({ type: AUTH_LOADING })
    try {
        await sendPasswordResetEmail(auth, email);
        dispatch({ type: AUTH_SUCCESS })
        toast.success('Please check your email');
        return true;
    } catch (err) {
      dispatch({ type: AUTH_ERROR })
      if(err.code === 'auth/user-not-found'){
        toast.error('Email not registered');
      } else {
        toast.error('Something went wrong');
      }
    }
}

export const varifyResetPasswordLink = (body) => async (dispatch) => {
  dispatch({ type: AUTH_LOADING })
  try {
    const data = await validateFirebaseLink(body);
    if(data.requestType === "PASSWORD_RESET"){
      dispatch({ type: AUTH_SUCCESS })
      toast.success('Password reset success');
      return true;
    } else {
      dispatch({ type: AUTH_ERROR })
      toast.error('Oops!! Link has expired')
      return false;
    }
  } catch (err) {
      dispatch({ type: AUTH_ERROR })
      toast.error('Oops!! Link has expired')
      return false;
  }
}

export const varifyEmail = (user =  null) => async () => {
  try {       
    const currentUser = await (user ? user : auth.currentUser);
    if(currentUser){
      sendEmailVerification(currentUser)
        .then(() => {
          toast.success('Please check your email');
          return true;
        }) 
    }
  } catch (error) {
    toast.error('Oops!! Link has expired')
    return false;    
  }             
} 

export const varifyEmailLink = async (body) => {
    const data = await validateFirebaseLink(body);
    if(data.requestType === "VERIFY_EMAIL"){
      return true;
    }
}

export const updateUser = (body) => {
  return {
    type: UPDATE_USER,
    payload: body
  }
}

export const editUserProfile = (body) => async (dispatch) => {
  dispatch({ type: AUTH_LOADING })
  try {
    const isUpdated = await updateUserDocument({ 
      fname: body.firstName, 
      lname: body.lastName, 
    })              

    if(isUpdated){
        dispatch({ type: AUTH_SUCCESS })
        dispatch(updateUser({ 
            fname: body.firstName, 
            lname: body.lastName,
        }))
        toast.success('Profile updated success');
    } else {
        toast.error('Something went wrong')
        dispatch({ type: AUTH_ERROR })
    }
  } catch (error) {
    dispatch({ type: AUTH_ERROR })
    toast.error('Something went wrong')
  }
}