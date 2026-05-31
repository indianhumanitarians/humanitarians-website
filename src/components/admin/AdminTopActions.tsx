import { Button } from "../common/Button";

export const AdminTopActions = () => (
  <>
    <Button to="/admin/cases/new">Add case</Button>
    <Button to="/admin/testimonials/new" variant="secondary">
      Add testimonial
    </Button>
  </>
);
