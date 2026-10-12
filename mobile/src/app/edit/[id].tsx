import { useLocalSearchParams } from 'expo-router';
import { Editor } from '../../components/editor';

export default function EditRecipe() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Editor existingId={id} />;
}
