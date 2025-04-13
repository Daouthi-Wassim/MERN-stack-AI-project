import { useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import { createUser } from '../../../redux/userHandle';

const AddUser = ({ role }) => {
  const { register, handleSubmit } = useForm();
  const dispatch = useDispatch();

  const onSubmit = (data) => {
    dispatch(createUser(role, {
      name: data.name,
      email: data.email,
      password: data.password,
      role: role.toUpperCase()
    }));
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} placeholder="Nom complet" required />
      <input {...register('email')} type="email" placeholder="Email" required />
      <input {...register('password')} type="password" placeholder="Mot de passe" required />
      <button type="submit">Créer {role}</button>
    </form>
  );
};
export default AddUser;