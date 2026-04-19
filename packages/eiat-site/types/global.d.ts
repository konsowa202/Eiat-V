type Doctor = {
  _id: string;
  _type: "doctor";
  _createdAt: string;
  _updatedAt: string;
  _rev: string;
  name: string;
  image?: {
    _type: "image";
    asset: {
      _ref: string;
      _type: "reference";
    };
  };
  license?: string;
  joinedAt?: string | number;
  about?: string;
  experience?: string | number;
  availability?: string[];
  department?: string;
};

type ButtonVariant =
  | "outline"
  | "default"
  | "link"
  | "secondary"
  | "destructive"
  | "ghost";

interface Plan {
  _id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  popular: boolean;
  buttonText: string;
  buttonVariant: ButtonVariant;
}
interface Testimonial {
  _id: string;
  name: string;
  age: number;
  treatment: string;
  rating: number;
  date: string;
  location: string;
  image?: {
    _type: "image";
    asset: {
      _ref: string;
      _type: "reference";
    };
  };
  quote: string;
  beforeImage?: {
    _type: "image";
    asset: {
      _ref: string;
      _type: "reference";
    };
  }; // URL to before image
  afterImage?: {
    _type: "image";
    asset: {
      _ref: string;
      _type: "reference";
    };
  }; // URL to after image
  featured?: boolean;
}
