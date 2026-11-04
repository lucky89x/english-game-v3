shader_type spatial;
render_mode diffuse_burley, specular_schlick_ggx;
varying vec3 world_pos;
varying vec3 world_normal;
void vertex(){
 world_pos=(MODEL_MATRIX*vec4(VERTEX,1.0)).xyz;
 world_normal=normalize(MODEL_NORMAL_MATRIX*NORMAL);
}
float hash2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise2(vec2 p){
 vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
 return mix(mix(hash2(i),hash2(i+vec2(1,0)),f.x),mix(hash2(i+vec2(0,1)),hash2(i+vec2(1)),f.x),f.y);
}
float segment(vec2 p,vec2 a,vec2 b){vec2 v=b-a; return length(p-a-v*clamp(dot(p-a,v)/dot(v,v),0.0,1.0));}
void fragment(){
 vec2 p=world_pos.xz;
 float broad=noise2(p*0.16)*0.65+noise2(p*0.39)*0.35;
 float detail=noise2(p*4.0);
 float flecks=noise2(p*17.0);
 float path=segment(p,vec2(0,19),vec2(-0.5,13));
 path=min(path,segment(p,vec2(-0.5,13),vec2(0.4,7)));
 path=min(path,segment(p,vec2(0.4,7),vec2(-0.2,1)));
 path=min(path,segment(p,vec2(-0.2,1),vec2(0.5,-6)));
 path=min(path,segment(p,vec2(0.5,-6),vec2(-1,-14)));
 path=min(path,segment(p,vec2(-1,-14),vec2(-2,-22)));
 float branch=segment(p,vec2(0,5),vec2(3,5.5));
 branch=min(branch,segment(p,vec2(3,5.5),vec2(5.3,7)));
 branch=min(branch,segment(p,vec2(15.8,7),vec2(18,8)));
 branch=min(branch,segment(p,vec2(18,8),vec2(18,12)));
 branch=min(branch,segment(p,vec2(0,11),vec2(-10,14)));
 branch=min(branch,segment(p,vec2(-10,14),vec2(-21,17)));
 branch=min(branch,segment(p,vec2(0,-7),vec2(-10,-12)));
 branch=min(branch,segment(p,vec2(-10,-12),vec2(-23,-20)));
 float edge=(noise2(p*1.5)-0.5)*0.45+(broad-0.5)*0.7;
 float worn=1.0-smoothstep(1.55,2.8,path+edge);
 worn=max(worn,1.0-smoothstep(0.9,1.95,branch+edge));
 float yard=min(length((p-vec2(-12,-6))/vec2(6.5,4.5)),length((p-vec2(12,-6))/vec2(6.5,4.5)));
 yard=min(yard,length((p-vec2(-1,-24))/vec2(10,7)));
 worn=max(worn,(1.0-smoothstep(0.65,1.15,yard+(broad-0.5)*0.3))*0.72);
 vec3 grass=mix(vec3(0.15,0.245,0.085),vec3(0.30,0.385,0.14),broad);
 grass*=0.93+detail*0.11+flecks*0.04;
 vec3 dirt=mix(vec3(0.30,0.205,0.115),vec3(0.43,0.31,0.19),broad);
 dirt*=0.94+detail*0.12;
 float grit=smoothstep(0.77,0.88,flecks)*0.15;
 dirt=mix(dirt,vec3(0.49,0.46,0.35),grit);
 vec3 base=mix(grass,dirt,worn);
 float slope=1.0-clamp(world_normal.y,0.0,1.0);
 float rock=clamp(smoothstep(0.12,0.34,slope)+smoothstep(4.0,8.0,world_pos.y)*0.35,0.0,0.8);
 base=mix(base,mix(vec3(0.27,0.29,0.25),vec3(0.43,0.44,0.36),detail),rock);
 float river=abs(p.x-(10.5+sin((p.y-7.0)*0.085)*3.0));
 float bank=(1.0-smoothstep(4.0,6.6,river+edge))*smoothstep(1.0,6.0,p.y);
 float wet=1.0-smoothstep(-0.25,0.07,world_pos.y);
 vec3 bank_color=mix(vec3(0.45,0.37,0.245),vec3(0.21,0.18,0.12),wet);
 base=mix(base,bank_color,bank*0.92);
 ALBEDO=base;
 ROUGHNESS=mix(0.96,0.68,bank*wet);
 SPECULAR=0.18;
}
