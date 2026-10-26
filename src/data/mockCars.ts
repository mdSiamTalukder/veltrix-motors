
export type Car = {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  year: number;
  mileage: number;
  transmission: "Automatic" | "Manual";
  fuelType: "Petrol" | "Diesel" | "Hybrid" | "Electric";
  condition: "New" | "Used";
  image: string;
  featured: boolean;
};

export const mockCars: Car[] = [
  {
    id: "car-001",
    name: "C-Class",
    brand: "Mercedes-Benz",
    category: "Luxury Sedan",
    price: 8500000,
    year: 2023,
    mileage: 12000,
    transmission: "Automatic",
    fuelType: "Petrol",
    condition: "Used",
    image:
      "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1000&q=85",
    featured: true,
  },
  {
    id: "car-002",
    name: "5 Series",
    brand: "BMW",
    category: "Executive Sedan",
    price: 9200000,
    year: 2022,
    mileage: 18500,
    transmission: "Automatic",
    fuelType: "Petrol",
    condition: "Used",
    image:
      "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1000&q=85",
    featured: true,
  },
  {
    id: "car-003",
    name: "911 Carrera",
    brand: "Porsche",
    category: "Sports Car",
    price: 28000000,
    year: 2024,
    mileage: 4500,
    transmission: "Automatic",
    fuelType: "Petrol",
    condition: "Used",
    image:
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1000&q=85",
    featured: true,
  },
  {
    id: "car-004",
    name: "Model 3",
    brand: "Tesla",
    category: "Electric Sedan",
    price: 6500000,
    year: 2024,
    mileage: 6000,
    transmission: "Automatic",
    fuelType: "Electric",
    condition: "Used",
    image:
      "https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=1000&q=85",
    featured: false,
  },
  {
    id: "car-005",
    name: "Range Rover Sport",
    brand: "Land Rover",
    category: "Luxury SUV",
    price: 19500000,
    year: 2023,
    mileage: 14000,
    transmission: "Automatic",
    fuelType: "Diesel",
    condition: "Used",
    image:
      "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1000&q=85",
    featured: false,
  },
  {
    id: "car-006",
    name: "Civic",
    brand: "Honda",
    category: "Sedan",
    price: 4200000,
    year: 2022,
    mileage: 22000,
    transmission: "Automatic",
    fuelType: "Petrol",
    condition: "Used",
    image:
      "https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=1000&q=85",
    featured: false,
  },
];
